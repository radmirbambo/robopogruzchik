// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// R1: используем || вместо ?? — GitHub Actions передаёт пустые строки, когда переменные не заданы
const site = process.env.SITE_URL || 'https://radmirbambo.github.io';
const base = process.env.BASE_PATH || '/robopogruzchik';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'always' },
});
