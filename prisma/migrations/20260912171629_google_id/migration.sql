/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'CREDENTIAL');

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" "AuthProvider" DEFAULT 'CREDENTIAL',
ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
