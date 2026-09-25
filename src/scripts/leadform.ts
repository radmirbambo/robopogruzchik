// Iframe Яндекс Формы: src ставим, когда секция близко к экрану или пришёл расчёт из калькулятора/тарифов,
// чтобы тяжёлая форма не грузилась вместе с первым экраном. UTM сохраняет scripts/main.ts, здесь только читаем.
import { SITE } from '../config';
import { buildFormUrl, formHeight, shrankSharply, type LeadContext } from '../lib/lead';
import { parseUtm, readUtm, safeSession } from '../lib/utm';
import { onLeadPrefill } from '../lib/bus';

const frame = document.querySelector<HTMLIFrameElement>('[data-yaform]');
let prefill: Omit<LeadContext, 'utm' | 'page'> = {};
// Человек начал заполнять форму — больше не перезагружаем iframe, иначе его ввод пропадёт
let engaged = false;

function context(): LeadContext {
  // Без sessionStorage (приватный режим) — UTM текущего адреса, как вернул бы captureUtm(null, …)
  const saved = readUtm(safeSession()) ?? { utm: parseUtm(location.search), landing: location.pathname };
  return { ...prefill, utm: saved.utm, page: saved.landing };
}

// embed.js Яндекс Форм подгоняет высоту iframe под форму. Грузим его вместе с формой, а не со страницей:
// его домен ставит сторонние cookie (R22). Скрипт вешает слушатель message раньше, чем форма успеет
// загрузиться и прислать высоту; до этого iframe держит фиксированную высоту из разметки.
let embedded = false;
function embed() {
  if (embedded) return;
  embedded = true;
  const s = document.createElement('script');
  s.src = 'https://forms.yandex.ru/_static/embed.js';
  s.async = true;
  document.head.appendChild(s);
}

function load() {
  if (!frame || !SITE.form.baseUrl || engaged) return;
  embed();
  const url = buildFormUrl(SITE.form.baseUrl, context());
  if (frame.getAttribute('src') !== url) frame.src = url;
}

// Прокрутку к #lead делают сами ссылки/кнопки CTA, здесь только src
onLeadPrefill((d) => { prefill = { ...prefill, ...d }; load(); });

// embed.js только меняет высоту iframe и не прокручивает страницу. После «Отправить» внизу длинной формы (~1300 px)
// она сжимается до карточки «Спасибо», а прокрутка остаётся прежней: человек видел бы пустоту и футер.
// Поэтому слушаем те же сообщения формы: первая высота снимает min-height обёртки (он держал место, пока форма
// грузилась), резкое сжатие после ввода возвращает к верху формы. Прокрутка — по CSS: плавно, при reduced motion
// мгновенно; scroll-padding-top оставляет место под липкой шапкой.
const FORM_ORIGIN = SITE.form.baseUrl ? new URL(SITE.form.baseUrl).origin : '';
let height = 0;
function onMessage(e: MessageEvent) {
  if (!frame || e.origin !== FORM_ORIGIN || e.source !== frame.contentWindow) return;
  const h = formHeight(e.data);
  if (!h) return;
  if (!height && frame.parentElement) frame.parentElement.style.minHeight = '0';
  // Кадр спустя: к этому времени embed.js уже выставил iframe новую высоту
  if (engaged && shrankSharply(height, h)) requestAnimationFrame(() => frame.scrollIntoView({ block: 'start' }));
  height = h;
}

if (frame) {
  addEventListener('message', onMessage);
  // Фокус ушёл в кросс-доменный iframe: у окна срабатывает blur, activeElement становится iframe
  addEventListener('blur', () => setTimeout(() => { if (document.activeElement === frame) engaged = true; }));
  // Отключаемся при первом пересечении, даже если форму уже загрузил клик по CTA
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); if (!frame.getAttribute('src')) load(); } }, { rootMargin: '600px' });
  io.observe(frame);
}
