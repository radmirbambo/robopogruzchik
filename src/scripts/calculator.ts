import { calculate, normalizeInput, LIMITS, REGIONS, type CalcResult, type RegionId, type TariffId } from '../lib/calc';
import { mln, rub } from '../lib/format';
import { calcSummary } from '../lib/lead';
import { announcement, barWidths, tariffView } from '../lib/calc-view';
import { emitLeadPrefill } from '../lib/bus';
import { countTo } from './countup';
import { goal } from './analytics';

function setup(root: HTMLElement) {
  const form = root.querySelector('form')!;
  const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const field = <T>(name: string) => form.elements.namedItem(name) as T;
  const units = field<HTMLInputElement>('units');
  const salary = field<HTMLInputElement>('salary');
  const region = field<HTMLSelectElement>('region');
  const live = $('[data-out=summary]');
  const [S_MIN, S_MAX] = LIMITS.salary;

  let used = false;
  let last: CalcResult = calculate(normalizeInput({ units: 4, mode: 'two', salary: REGIONS.msk.salary, withTaxes: true }));
  let liveTimer = 0;

  function read() {
    const fd = new FormData(form);
    const u = fd.get('units');
    // Пока поле пустое (стёрли, чтобы ввести другое число), считаем по последнему значению, а не по минимуму
    return normalizeInput({ units: u === '' ? last.input.units : u, mode: fd.get('mode'), salary: fd.get('salary'), withTaxes: fd.get('withTaxes') === 'on' });
  }

  function setBar(id: 'drivers' | TariffId, width: number, cost3y: number) {
    $(`[data-bar=${id}]`).style.width = `${width}%`;
    $(`[data-barv=${id}]`).textContent = mln(cost3y);
  }

  /** syncUnits=false — пока человек печатает в поле «Погрузчиков», не переписываем его ввод. */
  function render({ syncUnits = true, announce = true } = {}) {
    const input = read();
    if (syncUnits) units.value = String(input.units);
    $<HTMLOutputElement>('[data-out=salary]').textContent = rub(input.salary);
    salary.setAttribute('aria-valuetext', `${rub(input.salary)} в месяц`);
    salary.style.setProperty('--p', `${((input.salary - S_MIN) / (S_MAX - S_MIN)) * 100}%`);

    const r = (last = calculate(input));
    countTo($('[data-out=current]'), r.currentMonthly, rub);
    countTo($('[data-out=current3y]'), r.current3y, mln);
    const w = barWidths(r);
    setBar('drivers', w.drivers, r.current3y);
    for (const t of r.tariffs) {
      const v = tariffView(t);
      const card = $(`[data-tariff=${t.id}]`);
      const f = (k: string) => card.querySelector<HTMLElement>(`[data-f=${k}]`)!;
      f('capex').textContent = v.capex;
      f('monthly').textContent = v.monthly;
      f('payback').textContent = v.payback;
      f('saving3y').textContent = v.saving3y;
      f('saving3y').classList.toggle('text-alarm', v.loss);
      card.toggleAttribute('data-is-best', r.best === t.id);
      card.querySelector<HTMLElement>('[data-best]')!.hidden = r.best !== t.id;
      setBar(t.id, w[t.id], t.cost3y);
    }
    // Скринридер слышит одну итоговую фразу, когда человек перестал двигать ползунок
    clearTimeout(liveTimer);
    if (announce) liveTimer = window.setTimeout(() => { live.textContent = announcement(r); }, 700);
  }

  form.addEventListener('input', (e) => {
    if (e.target === region) salary.value = String(REGIONS[region.value as RegionId].salary);
    if (!used) { used = true; goal('calc_used'); }
    render({ syncUnits: e.target !== units });
  });
  form.addEventListener('change', (e) => { if (e.target === units) render(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); render(); });
  root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) => b.addEventListener('click', () => {
    units.value = String(last.input.units + Number(b.dataset.step));
    form.dispatchEvent(new Event('input', { bubbles: true }));
  }));
  // Прокрутку к форме делает сама ссылка href="#lead" (плавно через CSS, мгновенно при reduced motion)
  $('[data-action=calc-cta]').addEventListener('click', () => {
    goal('calc_cta');
    // Без тарифа: тариф человек выбирает сам в карточках тарифов, «выгоднее за 3 года» — не его выбор
    emitLeadPrefill({
      units: last.input.units, mode: last.input.mode,
      calc: calcSummary(last, REGIONS[region.value as RegionId].label),
    });
  });

  // Браузер мог восстановить значения формы (перезагрузка, «назад») — сверяем вывод с формой без озвучивания
  render({ announce: false });
}

// Модуль входит в общий scripts/main.ts: на страницах без калькулятора (privacy/) секции #calc нет — ничего не делаем
const root = document.getElementById('calc');
if (root) setup(root);
