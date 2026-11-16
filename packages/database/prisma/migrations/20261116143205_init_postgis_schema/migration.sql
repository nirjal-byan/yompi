-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_tiger_geocoder";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- CreateEnum
CREATE TYPE "AccommodationTier" AS ENUM ('BUDGET', 'STANDARD', 'COMFORT');

-- CreateEnum
CREATE TYPE "ConditionCategory" AS ENUM ('WEATHER', 'OFFICIAL_ADVISORY', 'TRAIL_REPORT');

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "boundary" geometry(Polygon, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxElevationM" INTEGER NOT NULL,
    "difficultyStars" INTEGER NOT NULL,
    "difficultyCriteria" TEXT NOT NULL,
    "scenicStars" INTEGER NOT NULL,
    "standardDays" INTEGER NOT NULL,
    "bestSeasons" TEXT[],
    "permitsRequired" TEXT[],
    "mapSpriteKey" TEXT NOT NULL,
    "mapX" DOUBLE PRECISION NOT NULL,
    "mapY" DOUBLE PRECISION NOT NULL,
    "coordinates" geometry(Point, 4326),
    "permitCostPerPersonNpr" INTEGER NOT NULL,
    "transportCostPerPersonNpr" INTEGER NOT NULL,
    "guideDailyRateNpr" INTEGER NOT NULL,
    "porterDailyRateNpr" INTEGER NOT NULL,
    "foodDailyPerPersonNpr" INTEGER NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteCheckpoint" (
    "id" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "elevationM" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "walkingHours" DOUBLE PRECISION NOT NULL,
    "elevationGainM" INTEGER NOT NULL,
    "elevationLossM" INTEGER NOT NULL,
    "notes" TEXT,
    "coordinates" geometry(Point, 4326),
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "RouteCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accommodation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "AccommodationTier" NOT NULL,
    "pricePerNightNpr" INTEGER NOT NULL,
    "checkpointName" TEXT NOT NULL,
    "distanceToNextKm" DOUBLE PRECISION,
    "facilities" TEXT[],
    "contactPhone" TEXT,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "Accommodation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrailCondition" (
    "id" TEXT NOT NULL,
    "category" "ConditionCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "geographicCoverage" TEXT NOT NULL,
    "confidenceLevel" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "TrailCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteCheckpoint" ADD CONSTRAINT "RouteCheckpoint_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accommodation" ADD CONSTRAINT "Accommodation_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrailCondition" ADD CONSTRAINT "TrailCondition_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
