-- CreateEnum
CREATE TYPE "GeoFeatureKind" AS ENUM ('COUNTRY_BOUNDARY', 'PEAK', 'CITY', 'GATEWAY', 'TRAIL');

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoFeature" (
    "id" TEXT NOT NULL,
    "kind" "GeoFeatureKind" NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT,
    "elevationM" INTEGER,
    "properties" JSONB,
    "geometry" geometry(Geometry, 4326) NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_key_key" ON "DataSource"("key");

-- CreateIndex
CREATE INDEX "GeoFeature_kind_idx" ON "GeoFeature"("kind");

-- CreateIndex
CREATE INDEX "GeoFeature_geometry_idx" ON "GeoFeature" USING GIST ("geometry");

-- CreateIndex
CREATE UNIQUE INDEX "GeoFeature_sourceId_sourceRef_key" ON "GeoFeature"("sourceId", "sourceRef");

-- AddForeignKey
ALTER TABLE "GeoFeature" ADD CONSTRAINT "GeoFeature_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
