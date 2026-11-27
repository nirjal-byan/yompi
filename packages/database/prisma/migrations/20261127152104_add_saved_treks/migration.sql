-- CreateTable
CREATE TABLE "SavedTrek" (
    "userId" TEXT NOT NULL,
    "trekId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedTrek_pkey" PRIMARY KEY ("userId","trekId")
);

-- AddForeignKey
ALTER TABLE "SavedTrek" ADD CONSTRAINT "SavedTrek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedTrek" ADD CONSTRAINT "SavedTrek_trekId_fkey" FOREIGN KEY ("trekId") REFERENCES "Trek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
