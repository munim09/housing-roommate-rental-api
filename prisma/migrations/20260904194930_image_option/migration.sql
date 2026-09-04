-- CreateTable
CREATE TABLE "AccommodationImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "flatId" TEXT,
    "roomId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccommodationImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccommodationImage_flatId_idx" ON "AccommodationImage"("flatId");

-- CreateIndex
CREATE INDEX "AccommodationImage_roomId_idx" ON "AccommodationImage"("roomId");

-- CreateIndex
CREATE INDEX "AccommodationImage_flatId_sortOrder_idx" ON "AccommodationImage"("flatId", "sortOrder");

-- CreateIndex
CREATE INDEX "AccommodationImage_roomId_sortOrder_idx" ON "AccommodationImage"("roomId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AccommodationImage" ADD CONSTRAINT "AccommodationImage_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationImage" ADD CONSTRAINT "AccommodationImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
