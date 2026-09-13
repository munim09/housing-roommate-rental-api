/*
  Warnings:

  - The values [PARTIALLY_PAID,OVERDUE] on the enum `BillStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE] on the enum `StayStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BillStatus_new" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "BillStatus_new" USING ("status"::text::"BillStatus_new");
ALTER TYPE "BillStatus" RENAME TO "BillStatus_old";
ALTER TYPE "BillStatus_new" RENAME TO "BillStatus";
DROP TYPE "public"."BillStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StayStatus_new" AS ENUM ('WAITING_FOR_PAYMENT', 'CONFIRMED', 'COMPLETED', 'TERMINATED', 'CANCELLED', 'EXPIRED');
ALTER TABLE "public"."Stay" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Stay" ALTER COLUMN "status" TYPE "StayStatus_new" USING ("status"::text::"StayStatus_new");
ALTER TYPE "StayStatus" RENAME TO "StayStatus_old";
ALTER TYPE "StayStatus_new" RENAME TO "StayStatus";
DROP TYPE "public"."StayStatus_old";
ALTER TABLE "Stay" ALTER COLUMN "status" SET DEFAULT 'WAITING_FOR_PAYMENT';
COMMIT;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours';
