-- AlterTable
ALTER TABLE "Advertisement" ADD COLUMN     "createdByTenantStayId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" SET DEFAULT CURRENT_TIMESTAMP + INTERVAL '12 hours';

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_createdByTenantStayId_fkey" FOREIGN KEY ("createdByTenantStayId") REFERENCES "Stay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
