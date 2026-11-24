-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "trekId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "fromPlace" TEXT NOT NULL,
    "toPlace" TEXT NOT NULL,
    "overnightPlace" TEXT,
    "overnightElevationM" INTEGER,
    "hoursText" TEXT,
    "notes" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryDay_slug_key" ON "ItineraryDay"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryDay_trekId_dayNumber_key" ON "ItineraryDay"("trekId", "dayNumber");

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_trekId_fkey" FOREIGN KEY ("trekId") REFERENCES "Trek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
