import { fromHono } from './chanfana-adapter';

import { Hono } from 'hono';
import { handle } from 'hono/vercel'

import { getSpots } from "./endpoints/getSpots";
import { createSpot } from "./endpoints/createSpot";

export const runtime = 'edge'

const app = new Hono().basePath('/api')

const openapi = fromHono(app, {
  base: '/api'
});

openapi.get('/spots/:origin', getSpots);
openapi.post('/spots', createSpot);

export const GET = handle(app)