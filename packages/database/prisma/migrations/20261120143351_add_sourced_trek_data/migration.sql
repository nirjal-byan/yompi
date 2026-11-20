-- CreateEnum
CREATE TYPE "PermitUnit" AS ENUM ('PER_PERSON', 'PER_PERSON_PER_DAY', 'PER_GROUP');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('GUIDE_DAILY', 'PORTER_DAILY', 'FOOD_DAILY', 'LODGING_BUDGET', 'LODGING_STANDARD', 'LODGING_COMFORT', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "CostUnit" AS ENUM ('PER_DAY', 'PER_NIGHT', 'PER_PERSON', 'PER_TRIP');

-- CreateTable
CREATE TABLE "Trek" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "trailId" TEXT,
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "highestPointM" INTEGER,
    "startPlace" TEXT,
    "endPlace" TEXT,
    "notes" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permit" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "amountNpr" INTEGER NOT NULL,
    "unit" "PermitUnit" NOT NULL,
    "notes" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrekPermit" (
    "trekId" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,

    CONSTRAINT "TrekPermit_pkey" PRIMARY KEY ("trekId","permitId")
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "amountNpr" INTEGER NOT NULL,
    "unit" "CostUnit" NOT NULL,
    "trekId" TEXT,
    "notes" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trek_slug_key" ON "Trek"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permit_slug_key" ON "Permit"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CostItem_slug_key" ON "CostItem"("slug");

-- AddForeignKey
ALTER TABLE "Trek" ADD CONSTRAINT "Trek_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "GeoFeature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrekPermit" ADD CONSTRAINT "TrekPermit_trekId_fkey" FOREIGN KEY ("trekId") REFERENCES "Trek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrekPermit" ADD CONSTRAINT "TrekPermit_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "Permit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_trekId_fkey" FOREIGN KEY ("trekId") REFERENCES "Trek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
