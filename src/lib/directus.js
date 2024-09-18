import { createDirectus, rest } from '@directus/sdk';

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL;

const directus = createDirectus(CMS_URL).with(
  rest({
    onRequest: (options) => ({ ...options, cache: 'no-store' }),
  })
);

export { directus };
export default directus;
