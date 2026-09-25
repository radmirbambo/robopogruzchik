import type { CalcResult, Mode, TariffId } from './calc';
import { MODES } from './calc';
import { months, rub } from './format';
import type { Utm } from './utm';

// Идентификаторы вопросов Яндекс Формы. Скрипт create-form.mjs читает этот же объект.
export const FORM_SLUGS = {
  name: 'name', company: 'company', phone: 'phone', email: 'email', city: 'city',
  units: 'units', mode: 'mode', tariff: 'tariff', comment: 'comment', consent: 'consent',
  calc: 'calc', page: 'page',
  // utm_* используют собственные имена как идентификаторы
} as const;

export interface LeadContext { units?: number; mode?: Mode; tariff?: TariffId; calc?: string; utm: Utm; page: string }

export function calcSummary(r: CalcResult, regionLabel?: string): string {
  const t = Object.fromEntries(r.tariffs.map((x) => [x.id, x]));
  const sub = t.subscription.monthlySaving;
  return [
    `${r.input.units} погр.`, MODES[r.input.mode].short, regionLabel, `ЗП ${rub(r.input.salary)}`,
    `взносы ${r.input.withTaxes ? 'да' : 'нет'}`, `сейчас ${rub(r.currentMonthly)}/мес`,
    `покупка окуп. ${months(t.turnkey.paybackMonths)}`, `ПАК окуп. ${months(t.pak.paybackMonths)}`,
    sub > 0 ? `подписка экономия ${rub(sub)}/мес` : `подписка дороже на ${rub(-sub)}/мес`,
  ].filter(Boolean).join(' · ');
}

export function buildFormUrl(baseUrl: string, ctx: LeadContext): string {
  const u = new URL(baseUrl);
  u.searchParams.set('iframe', '1');
  u.searchParams.set('theme', 'dark');
  const put = (k: string, v: string | number | undefined) => { if (v !== undefined && v !== '') u.searchParams.set(k, String(v)); };
  put(FORM_SLUGS.units, ctx.units);
  put(FORM_SLUGS.mode, ctx.mode);
  put(FORM_SLUGS.tariff, ctx.tariff);
  put(FORM_SLUGS.calc, ctx.calc);
  for (const [k, v] of Object.entries(ctx.utm)) put(k, v);
  put(FORM_SLUGS.page, ctx.page);
  return u.toString();
}

/** Высота формы из сообщения iframe — так её читает embed.js Яндекс Форм: JSON-строка с ключом iframe-height
 *  (форма шлёт '{"iframe-height":1326,"name":"ya-form-…"}', а ещё служебные 'loading', 'ping' и т. п.). */
export function formHeight(data: unknown): number | null {
  if (typeof data !== 'string') return null;
  try {
    const h = Number(JSON.parse(data)?.['iframe-height']);
    return h > 0 ? h : null;
  } catch { return null; }
}

/** Форма резко стала ниже (больше чем на 40 %): после «Отправить» вместо полей осталась карточка «Спасибо». */
export const shrankSharply = (prev: number, next: number): boolean => prev > 0 && next < prev * 0.6;
