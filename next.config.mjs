import withBundleAnalyzer from '@next/bundle-analyzer';

import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import optimizeLocales from '@react-aria/optimize-locales-plugin';

// Here we use the @cloudflare/next-on-pages next-dev module to allow us to use bindings during local development
// (when running the application with `next dev`), for more information see:
// https://github.com/cloudflare/next-on-pages/blob/5712c57ea7/internal-packages/next-dev/README.md
if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    config.plugins.push(
      optimizeLocales.webpack({
        locales: ['zh-TW']
      })
    );

    return config;
  },
};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});
export default withAnalyzer(nextConfig);
