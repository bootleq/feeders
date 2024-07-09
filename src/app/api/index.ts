import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { getFeedings } from "./endpoints/getFeedings";
import { createFeeding } from "./endpoints/createFeeding";

const app = new Hono();

const openapi = fromHono(app, {
  docs_url: '/'
});

openapi.get('/feedings/:origin', getFeedings);
openapi.post('/feedings', createFeeding);

export default app;
