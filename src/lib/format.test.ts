import { describe, it, expect } from 'vitest';
import { rub, mln, months, num } from './format';
const N = ' ';
describe('format', () => {
  it('rub', () => { expect(rub(1_092_000)).toBe(`1${N}092${N}000${N}₽`); expect(rub(-69_000)).toBe(`−69${N}000${N}₽`); expect(rub(1000).charCodeAt(1)).toBe(0x202f); });
  it('num', () => expect(num(2_500_000)).toBe(`2${N}500${N}000`));
  it('mln', () => { expect(mln(29_312_000)).toBe(`29,3${N}млн${N}₽`); expect(mln(10_000_000)).toBe(`10${N}млн${N}₽`); });
  it('months', () => {
    expect(months(9.1575)).toBe(`9,2${N}мес`);
    expect(months(12.5)).toBe(`12,5${N}мес`);
    expect(months(5)).toBe(`5${N}мес`);
    expect(months(0)).toBe('сразу');
    expect(months(null)).toBe('не окупается');
  });
});
