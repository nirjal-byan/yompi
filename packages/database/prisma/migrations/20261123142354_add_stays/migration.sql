-- CreateTable
CREATE TABLE "Stay" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "trekId" TEXT NOT NULL,
    "tier" "AccommodationTier" NOT NULL,
    "pricePerNightNpr" INTEGER,
    "elevationM" INTEGER,
    "notes" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stay_slug_key" ON "Stay"("slug");

-- CreateIndex
CREATE INDEX "Stay_trekId_idx" ON "Stay"("trekId");

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_trekId_fkey" FOREIGN KEY ("trekId") REFERENCES "Trek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
