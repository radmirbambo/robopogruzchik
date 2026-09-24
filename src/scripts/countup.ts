const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const running = new WeakMap<Element, number>();
export function countTo(el: HTMLElement, to: number, fmt: (n: number) => string, ms = 600) {
  const from = Number(el.dataset.v ?? 0);
  el.dataset.v = String(to);
  cancelAnimationFrame(running.get(el) ?? 0);
  if (reduce() || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) running.set(el, requestAnimationFrame(step));
  };
  running.set(el, requestAnimationFrame(step));
}
