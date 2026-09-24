export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;
type Store = Pick<Storage, 'getItem' | 'setItem'>;
const KEY = 'af_utm';

export function parseUtm(search: string): Utm {
  const p = new URLSearchParams(search);
  const out: Utm = {};
  for (const k of UTM_KEYS) { const v = p.get(k); if (v) out[k] = v.slice(0, 200); }
  return out;
}

export function safeSession(): Storage | null {
  try { const s = window.sessionStorage; s.setItem('__t', '1'); s.removeItem('__t'); return s; } catch { return null; }
}

export function captureUtm(storage: Store | null, search: string, page: string): { utm: Utm; landing: string } {
  const fresh = parseUtm(search);
  const hasFresh = Object.keys(fresh).length > 0;
  let saved: { utm: Utm; landing: string } | null = null;
  try { const raw = storage?.getItem(KEY); if (raw) saved = JSON.parse(raw); } catch { saved = null; }
  const result = hasFresh || !saved ? { utm: fresh, landing: page } : saved;
  if (hasFresh || !saved) { try { storage?.setItem(KEY, JSON.stringify(result)); } catch { /* хранилище недоступно */ } }
  return result;
}
