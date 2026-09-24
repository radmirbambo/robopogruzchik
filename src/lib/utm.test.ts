import { describe, it, expect } from 'vitest';
import { parseUtm, captureUtm, readUtm } from './utm';

const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe('utm', () => {
  it('parse берёт только utm_* и обрезает до 200 символов', () => {
    const u = parseUtm('?utm_source=tg&utm_campaign=%D1%81%D0%BA%D0%BB%D0%B0%D0%B4&x=1&utm_term=' + 'a'.repeat(300));
    expect(u).toEqual({ utm_source: 'tg', utm_campaign: 'склад', utm_term: 'a'.repeat(200) });
  });
  it('сохраняет в хранилище и отдаёт на следующей странице без utm', () => {
    const s = mem();
    expect(captureUtm(s, '?utm_source=tg', '/').utm).toEqual({ utm_source: 'tg' });
    expect(captureUtm(s, '', '/privacy/')).toEqual({ utm: { utm_source: 'tg' }, landing: '/' });
  });
  it('новые utm перезаписывают старые', () => {
    const s = mem();
    captureUtm(s, '?utm_source=tg', '/');
    expect(captureUtm(s, '?utm_source=vc', '/').utm).toEqual({ utm_source: 'vc' });
  });
  it('без хранилища и с бросающим хранилищем не падает (Review Focus 2)', () => {
    expect(captureUtm(null, '?utm_source=tg', '/').utm).toEqual({ utm_source: 'tg' });
    const bad = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(captureUtm(bad, '?utm_medium=cpc', '/')).toEqual({ utm: { utm_medium: 'cpc' }, landing: '/' });
  });
  it('readUtm только читает сохранённое captureUtm и ничего не пишет', () => {
    const s = mem();
    expect(readUtm(s)).toBeNull();
    captureUtm(s, '?utm_source=tg', '/privacy/');
    const spy = { getItem: s.getItem, setItem: () => { throw new Error('readUtm не должен писать'); } };
    expect(readUtm(spy)).toEqual({ utm: { utm_source: 'tg' }, landing: '/privacy/' });
  });
  it('readUtm: нет хранилища, бросающее хранилище или битый JSON — null', () => {
    expect(readUtm(null)).toBeNull();
    expect(readUtm({ getItem: () => { throw new Error('denied'); }, setItem: () => {} })).toBeNull();
    expect(readUtm({ getItem: () => '{oops', setItem: () => {} })).toBeNull();
  });
});
