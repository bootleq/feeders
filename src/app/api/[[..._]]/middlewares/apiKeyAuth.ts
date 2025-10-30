import { Context, Next } from 'hono';

export const apiKeyAuth = async (c: Context, next: Next) => {
  const apiKey = c.req.header('X-API-Key');

  if (!apiKey || apiKey !== process.env.ADMIN_API_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
};
