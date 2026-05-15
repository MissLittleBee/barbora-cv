import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://barborka.party',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
