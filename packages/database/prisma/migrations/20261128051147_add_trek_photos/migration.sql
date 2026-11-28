-- CreateTable
CREATE TABLE "TrekPhoto" (
    "trekId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "licenseUrl" TEXT,
    "sourceUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrekPhoto_pkey" PRIMARY KEY ("trekId")
);

-- AddForeignKey
ALTER TABLE "TrekPhoto" ADD CONSTRAINT "TrekPhoto_trekId_fkey" FOREIGN KEY ("trekId") REFERENCES "Trek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
