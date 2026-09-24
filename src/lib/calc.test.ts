import { describe, it, expect } from 'vitest';
import { calculate, normalizeInput, MODES, REGIONS } from './calc';

const t = (r: ReturnType<typeof calculate>, id: string) => r.tariffs.find((x) => x.id === id)!;

describe('calculate — проверочные расчёты из спецификации', () => {
  it('кейс 1: 1 машина, 2 смены, 100 000, без взносов', () => {
    const r = calculate({ units: 1, mode: 'two', salary: 100_000, withTaxes: false });
    expect(r.perUnitMonthly).toBe(200_000);
    expect(t(r, 'turnkey').paybackMonths).toBeCloseTo(12.5, 5);
    expect(t(r, 'pak').paybackMonths).toBeCloseTo(5, 5);
    expect(t(r, 'subscription').monthlySaving).toBe(40_000);
    expect(t(r, 'subscription').paybackMonths).toBe(0);
    expect(t(r, 'turnkey').saving3y).toBe(4_700_000);
    expect(t(r, 'pak').saving3y).toBe(3_720_000);
    expect(t(r, 'subscription').saving3y).toBe(1_440_000);
    expect(r.best).toBe('turnkey');
  });

  it('кейс 2: 24/7 = 4 водителя', () => {
    const r = calculate({ units: 1, mode: 'h24', salary: 100_000, withTaxes: false });
    expect(r.perUnitMonthly).toBe(400_000);
    expect(t(r, 'turnkey').paybackMonths).toBeCloseTo(6.25, 5);
  });

  it('кейс 3: 4 машины, 2 смены, Москва, со взносами', () => {
    const r = calculate({ units: 4, mode: 'two', salary: 105_000, withTaxes: true });
    expect(r.perUnitMonthly).toBe(273_000);
    expect(r.currentMonthly).toBe(1_092_000);
    expect(r.current3y).toBe(39_312_000);
    expect(t(r, 'turnkey').capex).toBe(10_000_000);
    expect(t(r, 'turnkey').paybackMonths).toBeCloseTo(9.1575, 3);
    expect(t(r, 'turnkey').saving3y).toBe(29_312_000);
  });

  it('кейс 4: 1 смена, регион — подписка дороже, ПАК почти не окупается', () => {
    const r = calculate({ units: 1, mode: 'one', salary: 70_000, withTaxes: true });
    expect(r.perUnitMonthly).toBe(91_000);
    expect(t(r, 'subscription').monthlySaving).toBe(-69_000);
    expect(t(r, 'subscription').paybackMonths).toBeNull();
    expect(t(r, 'pak').paybackMonths).toBeCloseTo(54.545, 2);
    expect(t(r, 'turnkey').paybackMonths).toBeCloseTo(27.4725, 3);
  });

  it('ПАК не окупается, если расход на машину ≤ 80 000', () => {
    const r = calculate({ units: 1, mode: 'one', salary: 60_000, withTaxes: false });
    expect(t(r, 'pak').paybackMonths).toBeNull();
  });

  it('best = null, когда ни один тариф не выгоден за 3 года', () => {
    const r = calculate({ units: 1, mode: 'one', salary: 30_000, withTaxes: false });
    expect(r.best).toBeNull();
  });
});

describe('normalizeInput — мусорный ввод (Review Focus 1)', () => {
  it.each([
    [{ units: '', mode: 'two', salary: 100000, withTaxes: true }, 1],
    [{ units: 0, mode: 'two', salary: 100000, withTaxes: true }, 1],
    [{ units: -5, mode: 'two', salary: 100000, withTaxes: true }, 1],
    [{ units: 1e9, mode: 'two', salary: 100000, withTaxes: true }, 50],
    [{ units: 'abc', mode: 'two', salary: 100000, withTaxes: true }, 1],
    [{ units: '7.6', mode: 'two', salary: 100000, withTaxes: true }, 8],
  ])('units %j → %i', (raw, expected) => {
    expect(normalizeInput(raw as any).units).toBe(expected);
  });

  it('зажимает зарплату и чинит режим', () => {
    const n = normalizeInput({ units: 2, mode: 'weird', salary: 5, withTaxes: 'yes' } as any);
    expect(n.salary).toBe(30_000);
    expect(n.mode).toBe('two');
    expect(n.withTaxes).toBe(true);
    expect(normalizeInput({ salary: 9e9 } as any).salary).toBe(300_000);
    expect(normalizeInput({ salary: NaN } as any).salary).toBe(REGIONS.other.salary);
  });

  it('результат никогда не содержит NaN/Infinity', () => {
    const r = calculate(normalizeInput({} as any));
    const nums: number[] = [];
    const walk = (obj: any): void => {
      if (typeof obj === 'number') {
        nums.push(obj);
      } else if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          for (const item of obj) walk(item);
        } else {
          for (const value of Object.values(obj)) walk(value);
        }
      }
    };
    walk(r);
    expect(nums.length).toBeGreaterThan(0);
    nums.forEach(x => expect(Number.isFinite(x)).toBe(true));
  });

  it('справочники соответствуют спецификации', () => {
    expect([MODES.one.drivers, MODES.two.drivers, MODES.h24.drivers]).toEqual([1, 2, 4]);
    expect([REGIONS.msk.salary, REGIONS.mo.salary, REGIONS.spb.salary, REGIONS.other.salary]).toEqual([105_000, 90_000, 85_000, 70_000]);
  });
});
