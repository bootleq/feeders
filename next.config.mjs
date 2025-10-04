import withBundleAnalyzer from '@next/bundle-analyzer';

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import optimizeLocales from '@react-aria/optimize-locales-plugin';

import { createRequire } from 'node:module';
import path from 'path';

const require = createRequire(import.meta.url);
const htmlDomParserPath = path.dirname(require.resolve('html-dom-parser'));
const webpack = require('webpack');

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  initOpenNextCloudflareForDev();
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

const rewritesFn = async function rewrites() {
  return [
    {
      source: '/charts/',
      destination: '/charts/index.html',
    },
    {
      source: '/charts/:path*.txt',
      destination: '/charts/:path*/index.txt',
    },
    {
      source: '/charts/:path*/',
      destination: '/charts/:path*/index.html',
    },
  ]
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // distDir: 'build', // next-on-pages doesn't support, can cause problems

  images: imagesConfig,

  trailingSlash: true,
  rewrites: rewritesFn,

  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.(".svg"));

    config.module.rules = [
      ...config.module.rules,
      {
        ...fileLoaderRule,
        test: /icon.svg$/,
      },
      {
        test: /\.svg$/,
        exclude: /icon.svg$/,
        issuer: /\.[jt]sx?$/,
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

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^leaflet$/,
        'leaflet/dist/leaflet.js'
      )
    );

    return config;
  },
};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});
export default withAnalyzer(nextConfig);
