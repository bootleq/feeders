import { createDirectus, rest } from '@directus/sdk';

export const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL;

const directus = createDirectus(CMS_URL).with(
  rest({
    onRequest: (options) => {
      // delete options.credentials;
      // delete options.cache;
      // delete options.headers;

      return {
        ...options,
        // credentials: 'omit',
        // cache: 'no-store',
      };
    },
  })
);

export { directus };
export default directus;
