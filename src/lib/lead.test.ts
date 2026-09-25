import { describe, it, expect } from 'vitest';
import { buildFormUrl, calcSummary, formHeight, FORM_SLUGS, shrankSharply } from './lead';
import { calculate } from './calc';

describe('lead', () => {
  it('calcSummary — короткая читаемая строка', () => {
    const N = ' ';
    const r = calculate({ units: 4, mode: 'two', salary: 105_000, withTaxes: true });
    expect(calcSummary(r, 'Москва')).toBe(
      `4 погр. · 2 смены · Москва · ЗП 105${N}000${N}₽ · взносы да · сейчас 1${N}092${N}000${N}₽/мес · ` +
      `покупка окуп. 9,2${N}мес · ПАК окуп. 3,1${N}мес · подписка экономия 452${N}000${N}₽/мес`,
    );
  });

  it('buildFormUrl: iframe, тёмная тема, предзаполнение, round-trip кириллицы и спецсимволов (Review Focus 3)', () => {
    const url = buildFormUrl('https://forms.yandex.ru/cloud/abc123/', {
      units: 4, mode: 'h24', tariff: 'pak', calc: 'a & b = #1 · склад',
      utm: { utm_source: 'tg канал', utm_campaign: 'q&a=1' }, page: '/?x=1',
    });
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe('https://forms.yandex.ru/cloud/abc123/');
    expect(u.searchParams.get('iframe')).toBe('1');
    expect(u.searchParams.get('theme')).toBe('dark');
    expect(u.searchParams.get(FORM_SLUGS.units)).toBe('4');
    expect(u.searchParams.get(FORM_SLUGS.mode)).toBe('h24');
    expect(u.searchParams.get(FORM_SLUGS.tariff)).toBe('pak');
    expect(u.searchParams.get(FORM_SLUGS.calc)).toBe('a & b = #1 · склад');
    expect(u.searchParams.get('utm_source')).toBe('tg канал');
    expect(u.searchParams.get('utm_campaign')).toBe('q&a=1');
    expect(u.searchParams.get(FORM_SLUGS.page)).toBe('/?x=1');
  });

  it('CTA тарифа без калькулятора: только тариф, без выдуманных units/mode/calc (I2)', () => {
    const u = new URL(buildFormUrl('https://forms.yandex.ru/cloud/abc/', { tariff: 'subscription', utm: {}, page: '/' }));
    expect(u.searchParams.get(FORM_SLUGS.tariff)).toBe('subscription');
    for (const k of [FORM_SLUGS.units, FORM_SLUGS.mode, FORM_SLUGS.calc]) expect(u.searchParams.has(k)).toBe(false);
  });

  it('CTA калькулятора: units/mode/calc без тарифа (I2)', () => {
    const u = new URL(buildFormUrl('https://forms.yandex.ru/cloud/abc/', { units: 3, mode: 'one', calc: 'расчёт', utm: {}, page: '/' }));
    expect(u.searchParams.get(FORM_SLUGS.units)).toBe('3');
    expect(u.searchParams.get(FORM_SLUGS.mode)).toBe('one');
    expect(u.searchParams.get(FORM_SLUGS.calc)).toBe('расчёт');
    expect(u.searchParams.has(FORM_SLUGS.tariff)).toBe(false);
  });

  it('не добавляет пустые параметры', () => {
    const u = new URL(buildFormUrl('https://forms.yandex.ru/cloud/abc/', { utm: {}, page: '/' }));
    expect([...u.searchParams.keys()].sort()).toEqual(['iframe', FORM_SLUGS.page, 'theme'].sort());
  });

  it('formHeight читает высоту как embed.js и пропускает служебные сообщения (I1)', () => {
    expect(formHeight('{"iframe-height":1326,"name":"ya-form-abc"}')).toBe(1326);
    expect(formHeight(JSON.stringify({ 'iframe-height': '180' }))).toBe(180);
    for (const d of ['loading', 'ping', '{"name":"ya-form-abc","message":"ping"}', '{"iframe-height":0}', 'null', '5', '', undefined, { 'iframe-height': 900 }])
      expect(formHeight(d)).toBeNull();
  });

  it('shrankSharply: только резкое сжатие (> 40 %), не первая высота и не мелкие изменения (I1)', () => {
    expect(shrankSharply(1326, 180)).toBe(true);
    expect(shrankSharply(1000, 590)).toBe(true);
    expect(shrankSharply(1000, 600)).toBe(false);
    expect(shrankSharply(1326, 1290)).toBe(false);
    expect(shrankSharply(1300, 1400)).toBe(false);
    expect(shrankSharply(0, 180)).toBe(false);
  });
});
