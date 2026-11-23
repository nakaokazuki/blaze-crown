// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://blaze-crown.com',
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => {
        if (page.includes('/search')) return false;
        if (page.includes('/drafts/')) return false;
        if (page.includes('/events/') && page.includes('/admin')) return false;
        return true;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
