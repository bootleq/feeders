import { fromHono } from './chanfana-adapter';

import { Hono } from 'hono';
import { handle } from 'hono/vercel'

import { getSpots } from "./endpoints/getSpots";
import { getFollowups } from './endpoints/getFollowups';
// import { createSpot } from "./endpoints/createSpot";

export const runtime = 'edge'

const app = new Hono().basePath('/api')

const openapi = fromHono(app, {
  base: '/api',
  docs_url: null,
  redoc_url: null,
  openapi_url: null,
});

openapi.get('/spots/:geohash', getSpots);
openapi.get('/followups/:spotId', getFollowups);

export const GET = handle(app)
export const POST = handle(app)