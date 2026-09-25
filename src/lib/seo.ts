// JSON-LD для главной: организация, продукт с тремя публичными тарифами (цены из PRICES, как в калькуляторе
// и карточках тарифов) и FAQPage из того же списка, что и аккордеон. Все адреса — абсолютные.
import { FAQ } from '../data/faq';
import { PRICES } from './calc';

export function seoJsonLd(url: string, logo: string, image: string): object[] {
  const org = { '@type': 'Organization', name: 'Беспилотный погрузчик', alternateName: 'Russian FMR', url, logo };
  // unitCode MON — цена в месяц (UN/CEFACT); без unitCode — разовый платёж
  const spec = (price: number, unitCode?: string) => ({ '@type': 'UnitPriceSpecification', price, priceCurrency: 'RUB', ...(unitCode ? { unitCode } : {}) });
  const offer = (name: string, price: number, priceSpecification?: object | object[]) => ({
    '@type': 'Offer', name, priceCurrency: 'RUB', price, availability: 'https://schema.org/InStock', url: url + '#pricing',
    ...(priceSpecification ? { priceSpecification } : {}),
  });
  return [
    { '@context': 'https://schema.org', ...org },
    { '@context': 'https://schema.org', '@type': 'Product', name: 'Беспилотный погрузчик — робот для перевозки паллет', image, brand: { '@type': 'Brand', name: 'Беспилотный погрузчик' },
      description: 'Программно-аппаратный комплекс превращает электротележку для паллет в автономного робота: навигация по потолочным меткам и камерам, без лидара, интеграция с WMS.',
      offers: [
        offer('Покупка под ключ', PRICES.turnkey),
        // ПАК: разовый платёж за комплекс плюс ежемесячная подписка на поддержку и обновления ПО
        offer('Только ПАК', PRICES.pakCapex, [spec(PRICES.pakCapex), spec(PRICES.pakMonthly, 'MON')]),
        offer('Всё в подписку', PRICES.subMonthly, spec(PRICES.subMonthly, 'MON')),
      ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
}
