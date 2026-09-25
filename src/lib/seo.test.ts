import { describe, it, expect } from 'vitest';
import { seoJsonLd } from './seo';
import { PRICES } from './calc';
import { FAQ } from '../data/faq';

const URL_ = 'https://radmirbambo.github.io/robopogruzchik/';
const blocks = seoJsonLd(URL_, URL_ + 'favicon.svg', URL_ + 'og.png') as Record<string, any>[];
const byType = (t: string) => blocks.find((b) => b['@type'] === t)!;

describe('seoJsonLd', () => {
  it('три блока schema.org: Organization, Product, FAQPage', () => {
    expect(blocks.map((b) => b['@type'])).toEqual(['Organization', 'Product', 'FAQPage']);
    for (const b of blocks) expect(b['@context']).toBe('https://schema.org');
  });

  it('в Product ровно три публичных тарифа из PRICES, в рублях', () => {
    const offers = byType('Product').offers;
    expect(offers.map((o: any) => [o.name, o.price])).toEqual([
      ['Покупка под ключ', PRICES.turnkey],
      ['Только ПАК', PRICES.pakCapex],
      ['Всё в подписку', PRICES.subMonthly],
    ]);
    for (const o of offers) expect(o.priceCurrency).toBe('RUB');
    expect(offers[2].priceSpecification).toMatchObject({ '@type': 'UnitPriceSpecification', price: PRICES.subMonthly, unitCode: 'MON' });
  });

  it('Только ПАК: разовая цена и 80 000 ₽/мес поддержки, как в карточке тарифа', () => {
    const pak = byType('Product').offers[1];
    expect(pak.price).toBe(PRICES.pakCapex);
    expect(pak.priceSpecification).toEqual([
      { '@type': 'UnitPriceSpecification', price: PRICES.pakCapex, priceCurrency: 'RUB' },
      { '@type': 'UnitPriceSpecification', price: PRICES.pakMonthly, priceCurrency: 'RUB', unitCode: 'MON' },
    ]);
    expect(byType('Product').offers[0].priceSpecification).toBeUndefined();
  });

  it('других цен в разметке нет: только четыре публичные суммы тарифов', () => {
    const prices = JSON.stringify(blocks).match(/"price":\d+/g)!.map((s) => Number(s.slice(8)));
    expect(new Set(prices)).toEqual(new Set([PRICES.turnkey, PRICES.pakCapex, PRICES.pakMonthly, PRICES.subMonthly]));
  });

  it('адреса абсолютные', () => {
    const org = byType('Organization');
    const product = byType('Product');
    for (const u of [org.url, org.logo, product.image, ...product.offers.map((o: any) => o.url)]) expect(u).toMatch(/^https:\/\//);
    expect(product.offers[0].url).toBe(URL_ + '#pricing');
  });

  it('FAQPage повторяет FAQ со страницы', () => {
    const faq = byType('FAQPage').mainEntity;
    expect(faq).toHaveLength(FAQ.length);
    expect(faq[0]).toEqual({ '@type': 'Question', name: FAQ[0].q, acceptedAnswer: { '@type': 'Answer', text: FAQ[0].a } });
  });
});
