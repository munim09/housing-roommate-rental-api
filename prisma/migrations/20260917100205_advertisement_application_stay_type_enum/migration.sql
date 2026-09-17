/*
  Warnings:

  - You are about to drop the column `category` on the `Advertisement` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `Advertisement` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Stay` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RentalType" AS ENUM ('PRIMARY_ENTIRE_FLAT', 'PRIMARY_ROOM', 'SECONDARY_ROOM', 'SECONDARY_ROOM_SHARING');

-- DropIndex
DROP INDEX "Advertisement_category_status_idx";

-- AlterTable
ALTER TABLE "Advertisement" DROP COLUMN "category",
DROP COLUMN "target",
ADD COLUMN     "rentalType" "RentalType" NOT NULL DEFAULT 'PRIMARY_ENTIRE_FLAT';

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "type",
ADD COLUMN     "rentalType" "RentalType" NOT NULL DEFAULT 'PRIMARY_ENTIRE_FLAT';

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours';

-- AlterTable
ALTER TABLE "Stay" DROP COLUMN "type",
ADD COLUMN     "rentalType" "RentalType" NOT NULL DEFAULT 'PRIMARY_ENTIRE_FLAT';

-- DropEnum
DROP TYPE "AdvertisementCategory";

-- DropEnum
DROP TYPE "AdvertisementTarget";

-- DropEnum
DROP TYPE "ApplicationType";

-- DropEnum
DROP TYPE "StayType";
