/*
  Warnings:

  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "type" SET DEFAULT 'RENT',
ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
