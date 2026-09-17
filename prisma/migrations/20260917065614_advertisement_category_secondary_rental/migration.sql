/*
  Warnings:

  - The values [ROOMMATE] on the enum `AdvertisementCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AdvertisementCategory_new" AS ENUM ('RENTAL', 'SECONDARY_RENTAL');
ALTER TABLE "Advertisement" ALTER COLUMN "category" TYPE "AdvertisementCategory_new" USING ("category"::text::"AdvertisementCategory_new");
ALTER TYPE "AdvertisementCategory" RENAME TO "AdvertisementCategory_old";
ALTER TYPE "AdvertisementCategory_new" RENAME TO "AdvertisementCategory";
DROP TYPE "public"."AdvertisementCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours';
