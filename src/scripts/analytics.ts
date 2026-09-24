// Яндекс.Метрика с отложенной загрузкой: тег не мешает первой отрисовке и грузится при первом действии
// человека (скролл, касание, клавиша). Цели, отправленные раньше, ждут в очереди.
// Клики по элементам с data-goal отправляют цель с этим именем.
import { SITE } from '../config';

type Params = Record<string, unknown>;
type Ym = ((id: number, action: string, ...args: unknown[]) => void) & { a?: IArguments[]; l?: number };
declare global {
  interface Window {
    ym?: Ym;
    /** Крючок для headless-проверок: видит все цели, даже когда Метрика выключена или не загружена */
    __afGoal?: (name: string, params?: Params) => void;
  }
}

const ID: number = SITE.metrikaId;
const TAG = 'https://mc.yandex.ru/metrika/tag.js';
const queue: [string, Params | undefined][] = [];
let ready = false;

export function goal(name: string, params?: Params) {
  window.__afGoal?.(name, params);
  if (!ID) return;
  if (ready && window.ym) window.ym(ID, 'reachGoal', name, params);
  else queue.push([name, params]);
}

function load() {
  if (ready || !ID) return;
  ready = true;
  // Официальная заглушка: вызовы копятся в ym.a, tag.js разберёт их после загрузки
  const ym: Ym = window.ym ?? (window.ym = function () { (ym.a = ym.a || []).push(arguments); } as Ym);
  ym.l = Date.now();
  const s = document.createElement('script');
  s.async = true;
  s.src = TAG;
  document.head.appendChild(s);
  ym(ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  for (const [n, p] of queue.splice(0)) ym(ID, 'reachGoal', n, p);
}

if (typeof window !== 'undefined') {
  if (ID) {
    // Только по действию человека, без загрузки по таймеру или в простое: до первого действия
    // на странице нет ни тега, ни cookie Яндекса (R22)
    const events = ['scroll', 'pointerdown', 'touchstart', 'keydown'];
    const kick = () => { events.forEach((e) => removeEventListener(e, kick)); load(); };
    events.forEach((e) => addEventListener(e, kick, { once: true, passive: true }));
  }
  // Фаза перехвата: цель уходит, даже если чей-то обработчик остановит всплытие
  document.addEventListener('click', (e) => {
    const g = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-goal]')?.dataset.goal : undefined;
    if (g) goal(g);
  }, true);
}
