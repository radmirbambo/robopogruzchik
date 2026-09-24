import { describe, it, expect } from 'vitest';
import { calculate, type TariffId } from './calc';
import { announcement, barWidths, tariffView } from './calc-view';

const N = '\u202f';
// Ожидания пишем обычными пробелами; разделитель U+202F проверяется отдельно
const plain = (x: string) => x.replace(/\u202f/g, ' ');
const views = (r: ReturnType<typeof calculate>) =>
  Object.fromEntries(r.tariffs.map((t) => {
    const v = tariffView(t);
    return [t.id, { ...v, capex: plain(v.capex), monthly: plain(v.monthly), payback: plain(v.payback), saving3y: plain(v.saving3y) }];
  })) as Record<TariffId, ReturnType<typeof tariffView>>;

describe('calc-view', () => {
  it('кейс 3 (дефолт): 4 машины, 2 смены, Москва, взносы', () => {
    const v = views(calculate({ units: 4, mode: 'two', salary: 105_000, withTaxes: true }));
    expect(v.turnkey).toEqual({ capex: '10 000 000 ₽', monthly: '—', payback: '9,2 мес', saving3y: '29,3 млн ₽', loss: false });
    expect(v.pak).toEqual({ capex: '2 400 000 ₽', monthly: '320 000 ₽/мес', payback: '3,1 мес', saving3y: '25,4 млн ₽', loss: false });
    expect(v.subscription).toEqual({ capex: 'без вложений', monthly: '640 000 ₽/мес', payback: 'сразу', saving3y: '16,3 млн ₽', loss: false });
  });

  it('кейс 4: 1 машина, 1 смена, Другие регионы, взносы — честные минусы', () => {
    const r = calculate({ units: 1, mode: 'one', salary: 70_000, withTaxes: true });
    expect(tariffView(r.tariffs[2]).saving3y).toBe(`дороже водителей на 69${N}000${N}₽/мес`);
    const v = views(r);
    expect(v.subscription.saving3y).toBe('дороже водителей на 69 000 ₽/мес');
    expect(v.subscription.payback).toBe('не окупается');
    expect(v.subscription.loss).toBe(true);
    // ПАК экономит в месяц, но за 3 года не окупается: 54,5 мес > 36
    expect(v.pak.payback).toBe('54,5 мес');
    expect(v.pak.saving3y).toBe('−204 000 ₽');
    expect(v.pak.loss).toBe(true);
    expect(v.turnkey.payback).toBe('27,5 мес');
    expect(v.turnkey.saving3y).toBe('776 000 ₽');
    expect(v.turnkey.loss).toBe(false);
  });

  it('нулевая экономия в месяц — «без экономии», а не «дороже на 0 ₽»', () => {
    const v = views(calculate({ units: 1, mode: 'two', salary: 80_000, withTaxes: false }));
    expect(v.subscription.saving3y).toBe('без экономии');
    expect(v.subscription.loss).toBe(true);
  });

  it('малые суммы за 3 года — в рублях, без «−0 млн ₽»', () => {
    // C = 96 200: ПАК за 3 года −16 800 ₽
    const v = views(calculate({ units: 1, mode: 'one', salary: 74_000, withTaxes: true }));
    expect(v.pak.saving3y).toBe('−16 800 ₽');
  });

  it('бары: максимум 100 %, остальные пропорциональны, все конечны', () => {
    const w = barWidths(calculate({ units: 4, mode: 'two', salary: 105_000, withTaxes: true }));
    expect(w.drivers).toBe(100);
    expect(w.turnkey).toBeCloseTo((10_000_000 / 39_312_000) * 100, 6);
    expect(w.subscription).toBeCloseTo((23_040_000 / 39_312_000) * 100, 6);
    for (const x of Object.values(w)) expect(Number.isFinite(x)).toBe(true);
  });

  it('объявление для скринридера', () => {
    expect(plain(announcement(calculate({ units: 4, mode: 'two', salary: 105_000, withTaxes: true })))).toBe(
      'Сейчас на водителях 1 092 000 ₽/мес. Выгоднее всего: покупка под ключ, окупаемость 9,2 мес, экономия за 3 года 29,3 млн ₽.',
    );
    expect(plain(announcement(calculate({ units: 1, mode: 'one', salary: 30_000, withTaxes: false })))).toBe(
      'Сейчас на водителях 30 000 ₽/мес. При этих условиях ни один вариант не окупается за 3 года.',
    );
  });
});
