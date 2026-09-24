export type Mode = 'one' | 'two' | 'h24';
export type RegionId = 'msk' | 'mo' | 'spb' | 'other';
export type TariffId = 'turnkey' | 'pak' | 'subscription';

export const MODES: Record<Mode, { drivers: number; label: string; short: string }> = {
  one: { drivers: 1, label: '1 смена · 5/2 по 8 ч', short: '1 смена' },
  two: { drivers: 2, label: '2 смены · 5/2 по 8 ч', short: '2 смены' },
  h24: { drivers: 4, label: '24/7 · 2/2 по 12 ч', short: '24/7' },
};

// Медианы вакансий «водитель погрузчика», trudvsem.ru 2026 + ГородРабот; см. спецификацию 5.1
export const REGIONS: Record<RegionId, { label: string; salary: number }> = {
  msk: { label: 'Москва', salary: 105_000 },
  mo: { label: 'Московская обл.', salary: 90_000 },
  spb: { label: 'СПб и ЛО', salary: 85_000 },
  other: { label: 'Другие регионы', salary: 70_000 },
};

export const PRICES = { turnkey: 2_500_000, pakCapex: 600_000, pakMonthly: 80_000, subMonthly: 160_000 } as const;
export const TAX_RATE = 0.3;
export const HORIZON = 36;
export const LIMITS = { units: [1, 50], salary: [30_000, 300_000] } as const;

export interface CalcInput { units: number; mode: Mode; salary: number; withTaxes: boolean }
export interface TariffResult {
  id: TariffId; capex: number; monthly: number; monthlySaving: number;
  paybackMonths: number | null; cost3y: number; saving3y: number;
}
export interface CalcResult {
  input: CalcInput; perUnitMonthly: number; currentMonthly: number; current3y: number;
  tariffs: TariffResult[]; best: TariffId | null;
}

const clamp = (x: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, x));
const toNum = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);

export function normalizeInput(raw: Partial<Record<keyof CalcInput, unknown>>): CalcInput {
  const u = toNum(raw.units);
  const s = toNum(raw.salary);
  const mode = typeof raw.mode === 'string' && raw.mode in MODES ? (raw.mode as Mode) : 'two';
  return {
    units: Number.isFinite(u) ? clamp(Math.round(u), LIMITS.units) : LIMITS.units[0],
    mode,
    salary: Number.isFinite(s) ? clamp(Math.round(s), LIMITS.salary) : REGIONS.other.salary,
    withTaxes: raw.withTaxes === undefined ? true : Boolean(raw.withTaxes),
  };
}

function tariff(id: TariffId, n: number, perUnit: number, capexPerUnit: number, monthlyPerUnit: number): TariffResult {
  const capex = capexPerUnit * n;
  const monthly = monthlyPerUnit * n;
  const monthlySaving = (perUnit - monthlyPerUnit) * n;
  const cost3y = capex + monthly * HORIZON;
  const saving3y = perUnit * n * HORIZON - cost3y;
  let paybackMonths: number | null;
  if (monthlySaving <= 0) paybackMonths = null;
  else if (capex === 0) paybackMonths = 0;
  else paybackMonths = capex / monthlySaving;
  return { id, capex, monthly, monthlySaving, paybackMonths, cost3y, saving3y };
}

export function calculate(input: CalcInput): CalcResult {
  const { units: n, mode, salary, withTaxes } = input;
  const perUnitMonthly = Math.round(MODES[mode].drivers * salary * (withTaxes ? 1 + TAX_RATE : 1));
  const currentMonthly = perUnitMonthly * n;
  const tariffs = [
    tariff('turnkey', n, perUnitMonthly, PRICES.turnkey, 0),
    tariff('pak', n, perUnitMonthly, PRICES.pakCapex, PRICES.pakMonthly),
    tariff('subscription', n, perUnitMonthly, 0, PRICES.subMonthly),
  ];
  const top = tariffs.reduce((a, b) => (b.saving3y > a.saving3y ? b : a));
  return { input, perUnitMonthly, currentMonthly, current3y: currentMonthly * HORIZON, tariffs, best: top.saving3y > 0 ? top.id : null };
}
