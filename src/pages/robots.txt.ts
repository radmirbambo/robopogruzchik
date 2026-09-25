// robots.txt из Astro.site и BASE_URL: после смены домена (переменные SITE_URL/BASE_PATH) адрес карты сайта
// поменяется сам, без правки файла руками
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(import.meta.env.BASE_URL + 'sitemap-index.xml', site).href;
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
