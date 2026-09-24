import type { Mode, TariffId } from './calc';
export interface LeadPrefill { units: number; mode: Mode; tariff?: TariffId; calc: string }
const EV = 'af:lead-prefill';
export const emitLeadPrefill = (detail: LeadPrefill) => window.dispatchEvent(new CustomEvent(EV, { detail }));
export const onLeadPrefill = (cb: (d: LeadPrefill) => void) => window.addEventListener(EV, (e) => cb((e as CustomEvent<LeadPrefill>).detail));
