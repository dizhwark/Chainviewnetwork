-- PostGIS geography columns + GiST indexes for production-grade geospatial
-- querying (radius search, distance sort, zone containment).
--
-- Requires the PostGIS extension. The local dev docker-compose.yml uses the
-- `postgis/postgis` base image so this applies cleanly there. If you are
-- running against a plain `postgres` image or a managed Postgres without the
-- PostGIS extension available, this migration will fail — either install
-- PostGIS on that instance first, or skip this migration and rely on the
-- plain lat/lng Float columns (Prisma Client can still do bounding-box
-- filtering + in-app Haversine distance at MVP scale).
--
-- These are *generated* geography columns derived from the existing lat/lng
-- Float columns, so application code keeps reading/writing lat/lng through
-- Prisma Client as normal — only geospatial queries (radius search, nearest-
-- plumber sort) need to reference `*_geog` directly via `$queryRaw`.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "ServiceZone"
  ADD COLUMN IF NOT EXISTS "centerGeog" geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("centerLng", "centerLat"), 4326)::geography) STORED;
CREATE INDEX IF NOT EXISTS "ServiceZone_centerGeog_idx" ON "ServiceZone" USING GIST ("centerGeog");

ALTER TABLE "CustomerAddress"
  ADD COLUMN IF NOT EXISTS "geog" geography(Point, 4326)
  GENERATED ALWAYS AS (
    CASE WHEN "lat" IS NOT NULL AND "lng" IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography
      ELSE NULL
    END
  ) STORED;
CREATE INDEX IF NOT EXISTS "CustomerAddress_geog_idx" ON "CustomerAddress" USING GIST ("geog");

ALTER TABLE "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "geog" geography(Point, 4326)
  GENERATED ALWAYS AS (
    CASE WHEN "lat" IS NOT NULL AND "lng" IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography
      ELSE NULL
    END
  ) STORED;
CREATE INDEX IF NOT EXISTS "ServiceRequest_geog_idx" ON "ServiceRequest" USING GIST ("geog");

ALTER TABLE "LocationEvent"
  ADD COLUMN IF NOT EXISTS "geog" geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography) STORED;
CREATE INDEX IF NOT EXISTS "LocationEvent_geog_idx" ON "LocationEvent" USING GIST ("geog");
