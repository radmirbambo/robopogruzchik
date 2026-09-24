// Iframe Яндекс Формы: src ставим, когда секция близко к экрану или пришёл расчёт из калькулятора/тарифов,
// чтобы тяжёлая форма не грузилась вместе с первым экраном. UTM сохраняет Base.astro, здесь только читаем.
import { SITE } from '../config';
import { buildFormUrl, type LeadContext } from '../lib/lead';
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

function load() {
  if (!frame || !SITE.form.baseUrl || engaged) return;
  const url = buildFormUrl(SITE.form.baseUrl, context());
  if (frame.getAttribute('src') !== url) frame.src = url;
}

// Прокрутку к #lead делают сами ссылки/кнопки CTA, здесь только src
onLeadPrefill((d) => { prefill = { ...prefill, ...d }; load(); });

if (frame) {
  // Фокус ушёл в кросс-доменный iframe: у окна срабатывает blur, activeElement становится iframe
  addEventListener('blur', () => setTimeout(() => { if (document.activeElement === frame) engaged = true; }));
  // Отключаемся при первом пересечении, даже если форму уже загрузил клик по CTA
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); if (!frame.getAttribute('src')) load(); } }, { rootMargin: '600px' });
  io.observe(frame);
}
