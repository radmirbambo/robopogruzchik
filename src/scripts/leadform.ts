// Iframe Яндекс Формы: src ставим, когда секция близко к экрану или пришёл расчёт из калькулятора/тарифов,
// чтобы тяжёлая форма не грузилась вместе с первым экраном. UTM и страница входа — из sessionStorage.
import { SITE } from '../config';
import { buildFormUrl, type LeadContext } from '../lib/lead';
import { captureUtm, safeSession } from '../lib/utm';
import { onLeadPrefill } from '../lib/bus';

const frame = document.querySelector<HTMLIFrameElement>('[data-yaform]');
const { utm, landing } = captureUtm(safeSession(), location.search, location.pathname);
let ctx: LeadContext = { utm, page: landing };
let loaded = false;

function load() {
  if (!frame || !SITE.form.baseUrl) return;
  frame.src = buildFormUrl(SITE.form.baseUrl, ctx);
  loaded = true;
}

onLeadPrefill((d) => { ctx = { ...ctx, ...d }; load(); });

if (frame) {
  // Отключаемся при первом пересечении, даже если форму уже загрузил клик по CTA
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); if (!loaded) load(); } }, { rootMargin: '600px' });
  io.observe(frame);
}
