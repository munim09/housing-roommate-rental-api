/*
  Warnings:

  - Made the column `areaId` on table `Property` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_areaId_fkey";

-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "areaId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
