/*
  Warnings:

  - The values [ROOM_SHARING] on the enum `StayType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StayType_new" AS ENUM ('PRIMARY', 'ROOMMATE');
ALTER TABLE "Stay" ALTER COLUMN "type" TYPE "StayType_new" USING ("type"::text::"StayType_new");
ALTER TYPE "StayType" RENAME TO "StayType_old";
ALTER TYPE "StayType_new" RENAME TO "StayType";
DROP TYPE "public"."StayType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours';
