import { z } from 'zod';
import { PubStateEnum, SpotActionEnum, SpotStateEnum } from '@/lib/schema';

export const geohash4 = z.string().min(4).describe('Geohash（4 碼）').openapi({example: 'wsqq'});
export const latitude = z.coerce.number().gte(-90).lte(90).describe('緯度 (Latitude)').openapi({example: 24.988040038688847});
export const longitude = z.coerce.number().gte(-180).lte(180).describe('經度 (Longitude)').openapi({example: 121.5210559478082});

export const geohash4tw = geohash4.refine(
  s => /^ws[hjkmnpqrtw]|^we[uvy]/.test(s),
  (val) => ({ message: `${val} 不在台灣地理範圍內` })
);

export const GetSpotsResult = z.object({
  id: z.number(),
  title: z.string(),
  lat: latitude,
  lon: longitude,
  city: z.string(),
  town: z.string(),
  geohash: z.string(),
  desc: z.string(),
  state: PubStateEnum,
  createdAt: z.coerce.date(),
  userId: z.string(),
  followerId: z.string(),
  action: SpotActionEnum,
  spotState: SpotStateEnum,
  material: z.string(),
  latestFollowAt: z.coerce.date(),
  followCount: z.number(),
  latestSpawnAt: z.coerce.date(),
  maxFeedee: z.number(),
});

export const GetSpotsByGeohash = z.object({
  geohash: geohash4,
  spots: z.array(GetSpotsResult),
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
