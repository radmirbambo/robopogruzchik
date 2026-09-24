const N = ' ';
const group = (n: number) => Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, N);
const sign = (n: number) => (n < 0 ? '−' : '');
const dec1 = (x: number) => { const r = Math.round(x * 10) / 10; return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ','); };
export const num = (n: number) => sign(n) + group(n);
export const rub = (n: number) => `${num(n)}${N}₽`;
export const mln = (n: number) => `${sign(n)}${dec1(Math.abs(n) / 1e6)}${N}млн${N}₽`;
export const months = (x: number | null) => (x === null ? 'не окупается' : x === 0 ? 'сразу' : `${dec1(x)}${N}мес`);
