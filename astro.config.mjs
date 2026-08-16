// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});


