// JSON-LD для главной: организация, продукт с тремя публичными тарифами (цены из PRICES, как в калькуляторе
// и карточках тарифов) и FAQPage из того же списка, что и аккордеон. Все адреса — абсолютные.
import { FAQ } from '../data/faq';
import { PRICES } from './calc';

export function seoJsonLd(url: string, logo: string, image: string): object[] {
  const org = { '@type': 'Organization', name: 'Беспилотный погрузчик', alternateName: 'Russian FMR', url, logo };
  const offer = (name: string, price: number, unit?: string) => ({
    '@type': 'Offer', name, priceCurrency: 'RUB', price, availability: 'https://schema.org/InStock', url: url + '#pricing',
    ...(unit ? { priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'RUB', unitCode: unit } } : {}),
  });
  return [
    { '@context': 'https://schema.org', ...org },
    { '@context': 'https://schema.org', '@type': 'Product', name: 'Беспилотный погрузчик — робот для перевозки паллет', image, brand: { '@type': 'Brand', name: 'Беспилотный погрузчик' },
      description: 'Программно-аппаратный комплекс превращает электротележку для паллет в автономного робота: навигация по потолочным меткам и камерам, без лидара, интеграция с WMS.',
      offers: [offer('Покупка под ключ', PRICES.turnkey), offer('Только ПАК', PRICES.pakCapex), offer('Всё в подписку', PRICES.subMonthly, 'MON')] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
}
