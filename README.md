# Беспилотный погрузчик — лендинг

Статический сайт на Astro и Tailwind. Сейчас он опубликован на GitHub Pages по адресу
<https://radmirbambo.github.io/robopogruzchik/> (путь `/robopogruzchik/`), пока не куплен свой домен.

## Запуск и проверка

Нужен Node.js 22.12 или новее.

```sh
npm ci            # зависимости
npm run dev       # разработка: http://localhost:4321/robopogruzchik/
npm test          # юнит-тесты (vitest): калькулятор, форматирование, заявка, UTM, SEO
npm run build     # сборка в dist/
npm run preview   # просмотр собранного dist/
```

## Публикация

Этот репозиторий собирается автоматически из приватного репозитория проекта, поэтому правки вносите там:
прямые коммиты сюда перезапишет следующая публикация. После пуша в `main` workflow
`.github/workflows/deploy.yml` прогоняет тесты, собирает сайт и выкладывает его на GitHub Pages.

## Что заменить до запуска трафика

Все значения лежат в `src/config.ts`:

- контакты: `phone`, `phoneHref`, `telegram`, `email`;
- оператор персональных данных: `operator.name`, `operator.status`, `operator.inn`. Они выводятся
  в футере и в политике конфиденциальности;
- `pricesIncludeVat`: `true` или `false` добавит под тарифами «Цены указаны с НДС» или «без НДС».
  При `null` про НДС ничего не пишем;
- `webmasterVerification`: код подтверждения из Яндекс Вебмастера (мета-тег `yandex-verification`).

Строки `id:` и `baseUrl:` в блоке `form` обновляются автоматически. Меняйте их вручную, только
сохраняя формат строки.

## Переезд на свой домен

1. В настройках репозитория (Settings → Secrets and variables → Actions → Variables) задайте
   `SITE_URL=https://ваш-домен` и `BASE_PATH=/`. Canonical, Open Graph, JSON-LD, sitemap и robots.txt
   соберутся с новым адресом сами.
2. В Settings → Pages укажите Custom domain, настройте DNS у регистратора и включите Enforce HTTPS.
3. В Яндекс Формах откройте редактор формы заявки. В подписи к галочке согласия стоит ссылка на политику
   по старому адресу github.io: замените её на новую.
4. В Яндекс Метрике в настройках счётчика укажите новый адрес сайта.
5. В Яндекс Вебмастере добавьте сайт на новом домене, подтвердите права (код — в `webmasterVerification`)
   и отправьте sitemap.
