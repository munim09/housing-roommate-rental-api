import cron from "node-cron";
import {
    ApplicationStatus,
    BillStatus,
    StayStatus,
} from "../../generated/prisma/client";
import { prisma } from "./prisma";

const OVERDUE_GRACE_MS = 60 * 60 * 1000;

let isRunning = false;

export const cancelOverdueStays = async () => {
    if (isRunning) {
        return;
    }

    isRunning = true;

    try {
        const overdueCutoff = new Date(Date.now() - OVERDUE_GRACE_MS);

        const overdueInvoices = await prisma.invoice.groupBy({
            by: ["stayId"],
            where: {
                status: BillStatus.PENDING,
                dueDate: { lt: overdueCutoff },
                stay: {
                    status: StayStatus.WAITING_FOR_PAYMENT,
                    application: { status: ApplicationStatus.APPROVED },
                },
            },
            _max: { dueDate: true },
        });

        let processed = 0;

        for (const group of overdueInvoices) {
            if (!group.stayId) {
                continue;
            }

            const stay = await prisma.stay.findFirst({
                where: {
                    id: group.stayId,
                    status: StayStatus.WAITING_FOR_PAYMENT,
                },
                select: { applicationId: true },
            });

            if (!stay?.applicationId) {
                continue;
            }

            await prisma.$transaction([
                prisma.invoice.updateMany({
                    where: { stayId: group.stayId, status: BillStatus.PENDING },
                    data: { BillStatus: BillStatus.CANCELLED },
                }),
                prisma.stay.update({
                    where: { id: group.stayId },
                    data: { status: StayStatus.CANCELLED },
                }),
                prisma.application.update({
                    where: { id: stay.applicationId },
                    data: { status: ApplicationStatus.EXPIRED },
                }),
            ]);

            processed++;
        }

        console.log(
            `[cron] Overdue stay check completed. Cancelled ${processed} stay(s).`,
        );
    } catch (error) {
        console.error("[cron] Overdue stay check failed:", error);
    } finally {
        isRunning = false;
    }
};

export const startCronJobs = async () => {
    cron.schedule("0 * * * *", cancelOverdueStays);

    console.log(
        "[cron] Cron jobs started. Overdue stay check runs every hour.",
    );
};
