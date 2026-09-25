import type { Mode, TariffId } from './calc';
// Только то, что человек выбрал сам: тарифы шлют один tariff, калькулятор — units/mode/calc без тарифа.
// Форма заявки (scripts/leadform.ts) складывает события, поэтому выбор тарифа после расчёта расчёт не стирает.
export interface LeadPrefill { units?: number; mode?: Mode; tariff?: TariffId; calc?: string }
const EV = 'af:lead-prefill';
export const emitLeadPrefill = (detail: LeadPrefill) => window.dispatchEvent(new CustomEvent(EV, { detail }));
export const onLeadPrefill = (cb: (d: LeadPrefill) => void) => window.addEventListener(EV, (e) => cb((e as CustomEvent<LeadPrefill>).detail));
