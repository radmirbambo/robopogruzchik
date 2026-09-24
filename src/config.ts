export const SITE = {
  brand: 'Беспилотный погрузчик',
  brandAlt: 'Russian FMR',
  // Контакты — заглушки до P5
  phone: '+7 (000) 000-00-00',
  phoneHref: 'tel:+70000000000',
  telegram: 'https://t.me/username',
  email: 'hello@example.ru',
  operator: {
    name: 'ФИО оператора',
    status: 'ИП / самозанятый',
    inn: '000000000000',
  },
  metrikaId: 0,            // P3; 0 = Метрика выключена
  webmasterVerification: '', // P3
  form: {
    // Заполняется скриптом integrations/yandex-form/create-form.mjs
    id: '6ab5a539898afd0b8e81a4f6',
    baseUrl: 'https://forms.yandex.ru/cloud/6ab5a539898afd0b8e81a4f6/',
  },
  pricesIncludeVat: null as null | boolean, // P5: null = не пишем про НДС
} as const;
