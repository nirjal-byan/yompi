-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "ConditionCategory" NOT NULL,
    "trekId" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Condition_slug_key" ON "Condition"("slug");

-- CreateIndex
CREATE INDEX "Condition_trekId_idx" ON "Condition"("trekId");

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_trekId_fkey" FOREIGN KEY ("trekId") REFERENCES "Trek"("id") ON DELETE SET NULL ON UPDATE CASCADE;
