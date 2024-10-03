import withBundleAnalyzer from '@next/bundle-analyzer';

import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import optimizeLocales from '@react-aria/optimize-locales-plugin';

import { createRequire } from 'node:module';
import path from 'path';

const require = createRequire(import.meta.url);
const htmlDomParserPath = path.dirname(require.resolve('html-dom-parser'));

const isDev = process.env.NODE_ENV === 'development';

// Here we use the @cloudflare/next-on-pages next-dev module to allow us to use bindings during local development
// (when running the application with `next dev`), for more information see:
// https://github.com/cloudflare/next-on-pages/blob/5712c57ea7/internal-packages/next-dev/README.md
if (isDev) {
  await setupDevPlatform();
}

const enableImgOptimize = !isDev;
const cmsURL = new URL(process.env.NEXT_PUBLIC_CMS_URL);
const imagesConfig = {
  unoptimized: !enableImgOptimize,
  remotePatterns: [
    {
      protocol: cmsURL.protocol.replace(':', ''),
      hostname: cmsURL.hostname,
      port: cmsURL.port,
      pathname: '/assets/**',
    },
  ],
};

if (enableImgOptimize) {
  imagesConfig['loader'] = 'custom';
  imagesConfig['loaderFile'] = './src/lib/loaders/r2.ts';
  // imagesConfig['loaderFile'] = './src/lib/loaders/cloudinary.ts';

  if (imagesConfig['loaderFile'].includes('/r2.ts')) {
    imagesConfig['deviceSizes'] = []; // avoid generate srcset 2x, currently doesn't support
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: imagesConfig,

  webpack(config) {
    config.module.rules = [
      ...config.module.rules,
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
      {
        test: /html-react-parser\/lib\/index\.js$/,
        resolve: {
          alias: {
            'html-dom-parser': path.join(htmlDomParserPath, 'server/html-to-dom.js'),
          },
        },
      },
    ];

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
