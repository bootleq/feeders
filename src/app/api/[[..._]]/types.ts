import { z } from 'zod';

export const latitude = z.coerce.number().gte(-90).lte(90).describe('緯度 (Latitude)').openapi({example: 24.988040038688847});
export const longitude = z.coerce.number().gte(-180).lte(180).describe('經度 (Longitude)').openapi({example: 121.5210559478082});

export const PubStateEnum = z.enum(["draft", "published", "dropped"]);
type PubStateEnum = z.infer<typeof PubStateEnum>;
