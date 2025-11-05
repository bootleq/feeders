import { fromHono } from './chanfana-adapter';

import { Hono } from 'hono';
import { etag } from 'hono/etag';
import { handle } from 'hono/vercel';
import { apiKeyAuth } from './middlewares/apiKeyAuth';

import { getSpots } from "./endpoints/getSpots";
import { getFollowups } from './endpoints/getFollowups';
import { getFactPicks } from './endpoints/getFactPicks';
import { getMyFactPicks } from './endpoints/getMyFactPicks';
import { deleteCache } from './endpoints/deleteCache';
// import { createSpot } from "./endpoints/createSpot";

const app = new Hono().basePath('/api')

app.use('/*', etag());

const openapi = fromHono(app, {
  base: '/api',
  docs_url: null,
  redoc_url: null,
  openapi_url: null,
});

openapi.get('/spots/:geohash/', getSpots);
openapi.get('/followups/:spotId/', getFollowups);
openapi.get('/picks/', getFactPicks);
openapi.get('/picks/my/', getMyFactPicks);
openapi.delete('/cache/', apiKeyAuth, deleteCache);

export const GET = handle(app)
export const POST = handle(app)
export const DELETE = handle(app)