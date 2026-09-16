import cron from "node-cron";
import {
    ApplicationStatus,
    BillStatus,
    PaymentStatus,
    StayStatus,
    UserStatus,
} from "../../generated/prisma/client";
import { prisma } from "./prisma";
import { PaymentService } from "../module/payment/payment.service";

const OVERDUE_GRACE_MS = 60 * 60 * 1000;
const UNVERIFIED_USER_GRACE_MS = 2 * 60 * 60 * 1000;
const PENDING_PAYMENT_THRESHOLD_MS = 8 * 60 * 60 * 1000;

let isRunning = false;
let isDeletingUnverifiedUsers = false;
let isVerifyingPendingPayments = false;

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

export const deleteUnverifiedUsers = async () => {
    if (isDeletingUnverifiedUsers) {
        return;
    }

    isDeletingUnverifiedUsers = true;

    try {
        const cutoff = new Date(Date.now() - UNVERIFIED_USER_GRACE_MS);

        const result = await prisma.user.deleteMany({
            where: {
                emailVerified: false,
                status: UserStatus.PENDING_APPROVAL,
                createdAt: { lt: cutoff },
            },
        });

        console.log(
            `[cron] Unverified user check completed. Deleted ${result.count} user(s).`,
        );
    } catch (error) {
        console.error("[cron] Unverified user check failed:", error);
    } finally {
        isDeletingUnverifiedUsers = false;
    }
};

export const verifyPendingPayments = async () => {
    if (isVerifyingPendingPayments) {
        return;
    }

    isVerifyingPendingPayments = true;

    try {
        const cutoff = new Date(Date.now() - PENDING_PAYMENT_THRESHOLD_MS);

        const pendingPayments = await prisma.payment.findMany({
            where: {
                status: PaymentStatus.PENDING,
                createdAt: { lte: cutoff },
                transactionReference: { not: null },
            },
            select: { id: true, transactionReference: true },
        });

        let checked = 0;
        let updated = 0;

        for (const payment of pendingPayments) {
            if (!payment.transactionReference) {
                continue;
            }

            try {
                const result = await PaymentService.checkPayment(
                    payment.transactionReference,
                );

                checked++;

                if (result.status !== PaymentStatus.PENDING) {
                    updated++;
                }

                console.log(
                    `[cron] Payment ${payment.id} verified. New status: ${result.status}`,
                );
            } catch (error: any) {
                console.error(
                    `[cron] Failed to verify payment ${payment.id}: ${
                        error?.message || error
                    }`,
                );
            }
        }

        console.log(
            `[cron] Pending payment check completed. Checked ${checked} payment(s), ${updated} updated.`,
        );
    } catch (error) {
        console.error("[cron] Pending payment check failed:", error);
    } finally {
        isVerifyingPendingPayments = false;
    }
};

export const startCronJobs = async () => {
    cron.schedule("0 * * * *", cancelOverdueStays);
    cron.schedule("0 * * * *", deleteUnverifiedUsers);
    cron.schedule("0 */12 * * *", verifyPendingPayments);

    console.log(
        "[cron] Cron jobs started. Overdue stay and unverified user checks run every hour. Pending payment check runs every 12 hours.",
    );
};
