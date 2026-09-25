// Единственный скрипт сайта, подключает Base.astro. Раньше у каждого компонента был свой <script>, и Vite выносил
// общие модули в отдельные чанки: Base → analytics → config — три запроса подряд. Теперь один файл без импортов.
// Каждый модуль сам ищет свою секцию и молча выходит, если её нет на странице (privacy/).
import { captureUtm, safeSession } from '../lib/utm';
import './analytics';
import './calculator';
import './pricing';
import './leadform';

// Единственный захват UTM: на любой странице входа (в т. ч. /privacy/). Форма заявки читает их из sessionStorage
// только при загрузке iframe — из IntersectionObserver или клика по CTA, то есть позже этой строки.
captureUtm(safeSession(), location.search, location.pathname);
