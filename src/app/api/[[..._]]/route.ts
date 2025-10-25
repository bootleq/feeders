import { fromHono } from './chanfana-adapter';

import { Hono } from 'hono';
import { handle } from 'hono/vercel'

import { getSpots } from "./endpoints/getSpots";
import { getFollowups } from './endpoints/getFollowups';
import { getFactPicks } from './endpoints/getFactPicks';
import { getFactPickById } from './endpoints/getFactPickById';
import { getMyFactPicks } from './endpoints/getMyFactPicks';
// import { createSpot } from "./endpoints/createSpot";

const app = new Hono().basePath('/api')

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
openapi.get('/picks/:id/', getFactPickById);

export const GET = handle(app)
export const POST = handle(app)