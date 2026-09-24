// Контакты для формы заявки, футера и политики: один список, одинаковые цели Метрики (data-goal, Task 11).
export interface Contact { label: string; value: string; href: string; goal: 'click_phone' | 'click_telegram' | 'click_email'; external: boolean }
interface Src { phone: string; phoneHref: string; telegram: string; email: string }

/** https://t.me/robo → @robo; инвайт-ссылки (+…, joinchat) показываем как есть. */
export function telegramHandle(url: string): string {
  const m = /^https:\/\/t\.me\/([A-Za-z0-9_]{3,})\/?$/.exec(url);
  return m ? `@${m[1]}` : url;
}

export function contactList(s: Src): Contact[] {
  return [
    { label: 'Телефон', value: s.phone, href: s.phoneHref, goal: 'click_phone', external: false },
    { label: 'Telegram', value: telegramHandle(s.telegram), href: s.telegram, goal: 'click_telegram', external: true },
    { label: 'Email', value: s.email, href: `mailto:${s.email}`, goal: 'click_email', external: false },
  ];
}
