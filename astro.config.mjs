import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

/**
 * Astro config for the Flavorz white-label template.
 *
 * `output: 'static'` is deliberate: every build produces plain files that can
 * be uploaded to S3 and served through CloudFront with no compute. Tenant
 * identity is resolved in the browser from the hostname, so one build serves
 * every brand.
 */
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://example.com',
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    ssr: {
      // Astryx ships pre-built CSS that must not be externalized during the
      // static render pass, or the token layer goes missing from the HTML.
      noExternal: ['@astryxdesign/core', '@astryxdesign/theme-neutral'],
    },
  },
});
