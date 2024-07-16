import { z } from 'zod';
import { PubStateEnum } from '@/lib/schema';

export const latitude = z.coerce.number().gte(-90).lte(90).describe('緯度 (Latitude)').openapi({example: 24.988040038688847});
export const longitude = z.coerce.number().gte(-180).lte(180).describe('經度 (Longitude)').openapi({example: 121.5210559478082});

export const GetSpotsResult = z.object({
  id: z.number(),
  title: z.string(),
  desc: z.string(),
  lat: latitude,
  lon: longitude,
  state: PubStateEnum,
  createdAt: z.coerce.date(),
  userId: z.string()
});

export const CreateSpotResult = z.object({
  id: z.number(),
  title: z.string(),
  desc: z.string(),
  lat: latitude,
  lon: longitude,
  state: PubStateEnum,
  createdAt: z.date(),
  authorId: z.number()
});
