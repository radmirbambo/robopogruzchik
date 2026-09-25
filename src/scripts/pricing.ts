// CTA карточек тарифов. Только тариф: число машин и режим человек здесь не выбирал. Если в форму уже ушёл расчёт
// калькулятора, он остаётся — форма складывает события. Прокрутку к форме делает сама ссылка href="#lead"
import { emitLeadPrefill } from '../lib/bus';
import type { TariffId } from '../lib/calc';

document.querySelectorAll<HTMLAnchorElement>('#pricing [data-tariff]').forEach((a) => a.addEventListener('click', () => {
  emitLeadPrefill({ tariff: a.dataset.tariff as TariffId });
}));
