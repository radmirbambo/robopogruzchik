// Тексты вывода калькулятора. Один источник для серверного рендера (Calculator.astro)
// и для острова (scripts/calculator.ts), чтобы страница без JS и после гидрации совпадали.
import type { CalcResult, TariffId, TariffResult } from './calc';
import { mln, months, rub } from './format';

export const TARIFF_LABELS: Record<TariffId, string> = {
  turnkey: 'Покупка под ключ',
  pak: 'Только ПАК',
  subscription: 'Всё в подписку',
};
export const TARIFF_SHORT: Record<TariffId, string> = { turnkey: 'Покупка', pak: 'ПАК', subscription: 'Подписка' };

// Суммы меньше миллиона — в рублях: иначе −16 800 ₽ превращается в «−0 млн ₽»
const money = (x: number) => (Math.abs(x) >= 1e6 ? mln(x) : rub(x));

export interface TariffView { capex: string; monthly: string; payback: string; saving3y: string; loss: boolean }

export function tariffView(t: TariffResult): TariffView {
  let saving3y: string;
  if (t.monthlySaving < 0) saving3y = `дороже водителей на ${rub(-t.monthlySaving)}/мес`;
  else if (t.monthlySaving === 0) saving3y = 'без экономии';
  else saving3y = money(t.saving3y);
  return {
    capex: t.capex ? rub(t.capex) : 'без вложений',
    monthly: t.monthly ? `${rub(t.monthly)}/мес` : '—',
    payback: months(t.paybackMonths),
    saving3y,
    loss: t.saving3y <= 0,
  };
}

/** Ширины баров «3 года» в процентах от самого дорогого варианта. */
export function barWidths(r: CalcResult): Record<'drivers' | TariffId, number> {
  const max = Math.max(r.current3y, ...r.tariffs.map((t) => t.cost3y));
  const pct = (x: number) => (max > 0 ? (x / max) * 100 : 0);
  return {
    drivers: pct(r.current3y),
    ...(Object.fromEntries(r.tariffs.map((t) => [t.id, pct(t.cost3y)])) as Record<TariffId, number>),
  };
}

/** Короткая сводка для aria-live: одна фраза вместо озвучивания каждой анимированной цифры. */
export function announcement(r: CalcResult): string {
  const head = `Сейчас на водителях ${rub(r.currentMonthly)}/мес.`;
  const best = r.tariffs.find((t) => t.id === r.best);
  if (!best) return `${head} При этих условиях ни один вариант не окупается за 3 года.`;
  return `${head} Выгоднее всего: ${TARIFF_LABELS[best.id].toLowerCase()}, окупаемость ${months(best.paybackMonths)}, экономия за 3 года ${money(best.saving3y)}.`;
}
