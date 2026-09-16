-- AlterEnum
ALTER TYPE "AdvertisementTarget" ADD VALUE 'ROOM_SHARING';

-- AlterEnum
ALTER TYPE "ApplicationType" ADD VALUE 'ROOM_SHARING';

-- AlterEnum
ALTER TYPE "StayType" ADD VALUE 'ROOM_SHARING';

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours';
