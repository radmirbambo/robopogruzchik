import { describe, it, expect } from 'vitest';
import { contactList, telegramHandle } from './contacts';

describe('contacts', () => {
  it('telegramHandle превращает ссылку t.me в @ник', () => {
    expect(telegramHandle('https://t.me/robo_fmr')).toBe('@robo_fmr');
    expect(telegramHandle('https://t.me/robo_fmr/')).toBe('@robo_fmr');
    expect(telegramHandle('https://t.me/+AbC123')).toBe('https://t.me/+AbC123'); // инвайт-ссылку не выдаём за ник
  });
  it('contactList: телефон, Telegram, email с целями Метрики и рабочими ссылками', () => {
    const list = contactList({ phone: '+7 (900) 000-00-00', phoneHref: 'tel:+79000000000', telegram: 'https://t.me/robo', email: 'a@b.ru' });
    expect(list.map((c) => c.goal)).toEqual(['click_phone', 'click_telegram', 'click_email']);
    expect(list.map((c) => c.href)).toEqual(['tel:+79000000000', 'https://t.me/robo', 'mailto:a@b.ru']);
    expect(list.map((c) => c.value)).toEqual(['+7 (900) 000-00-00', '@robo', 'a@b.ru']);
    expect(list.map((c) => c.external)).toEqual([false, true, false]);
  });
});
