import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import * as schema from '@/lib/schema';

// "any" workaround, can't build otherwise
// https://github.com/cloudflare/next-on-pages/issues/675#issuecomment-1959334672
export const db = drizzle((process.env as any).DB as D1Database, { schema });
