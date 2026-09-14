import axios from "axios";
import httpStatus from "http-status";
import {
    BillStatus,
    InvoiceType,
    PaymentStatus,
    Prisma,
    StayStatus,
} from "../../../generated/prisma/client";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IPaymentQuery } from "./payment.interface";

const SSL_PAYMENT_API = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

const SSL_VALIDATION_API =
    "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

const SSL_TRANSACTION_QUERY_API =
    "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";

const ACTIVE_PAYMENT_STATUSES: PaymentStatus[] = [
    PaymentStatus.PENDING,
    PaymentStatus.PROCESSING,
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const addOneMonth = (date: Date): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + 29);
    // result.setMonth(result.getMonth() + 1);
    return result;
};

interface RentInvoiceData {
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    amount: number;
    dueDate: Date;
}

const buildRemainingRentInvoices = (
    stay: {
        startDate: Date;
        endDate: Date;
        monthlyRent: Prisma.Decimal | number;
    },
    existingBillingStarts: Set<string>,
): RentInvoiceData[] => {
    const monthlyRent = Number(stay.monthlyRent);
    const invoices: RentInvoiceData[] = [];

    let cursor = new Date(stay.startDate);
    let isFirst = true;

    console.log("cursor 1", cursor);
    while (cursor <= stay.endDate) {
        const blockEnd = addOneMonth(cursor);
        console.log("blockEnd 1", blockEnd);
        const finalEnd = blockEnd > stay.endDate ? stay.endDate : blockEnd;
        console.log("finalEnd 1", finalEnd);
        const billedDays =
            Math.round((finalEnd.getTime() - cursor.getTime()) / MS_PER_DAY) +
            1;

        const amount = Number(
            ((monthlyRent / 30) * Math.max(billedDays, 1)).toFixed(2),
        );

        // if (!isFirst && !existingBillingStarts.has(cursor.toISOString())) {
        if (!existingBillingStarts.has(cursor.toISOString())) {
            const dueDate = new Date(cursor);
            dueDate.setDate(dueDate.getDate() - 1);

            invoices.push({
                billingPeriodStart: cursor,
                billingPeriodEnd: finalEnd,
                amount,
                dueDate,
            });
        }

        isFirst = false;

        if (finalEnd >= stay.endDate) {
            break;
        }

        cursor = new Date(finalEnd);
        cursor.setDate(cursor.getDate() + 1);
        console.log("cursor 2", cursor);
        console.log("finalEnd 2", finalEnd);
    }

    return invoices;
};

const markPaymentSuccess = async (paymentId: string, gatewayResponse: any) => {
    return prisma.$transaction(async (tx) => {
        const current = await tx.payment.findUnique({
            where: { id: paymentId },
        });

        if (!current) {
            throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
        }

        if (current.status === PaymentStatus.SUCCESS) {
            return current;
        }

        const updated = await tx.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.SUCCESS,
                paidAt: new Date(),
                gatewayResponse: gatewayResponse as Prisma.InputJsonValue,
                failureReason: null,
            },
        });

        if (current.invoiceId) {
            const invoice = await tx.invoice.findUnique({
                where: { id: current.invoiceId },
            });

            await prisma.$transaction(async (tx) => {
                if (invoice && invoice.status !== BillStatus.PAID) {
                    await tx.invoice.update({
                        where: { id: invoice.id },
                        data: { status: BillStatus.PAID },
                    });

                    if (invoice.type === InvoiceType.RENT && invoice.stayId) {
                        const stay = await tx.stay.findFirst({
                            where: {
                                id: invoice.stayId,
                                status: StayStatus.WAITING_FOR_PAYMENT,
                            },
                        });

                        if (stay) {
                            await tx.stay.update({
                                where: { id: stay.id },
                                data: { status: StayStatus.CONFIRMED },
                            });

                            const existingInvoices = await tx.invoice.findMany({
                                where: {
                                    stayId: stay.id,
                                    type: "RENT",
                                    status: {
                                        in: ["PAID", "PENDING"],
                                    },
                                },
                                select: {
                                    billingPeriodStart: true,
                                },
                            });

                            const existingBillingStarts = new Set(
                                existingInvoices.map((existing) =>
                                    existing.billingPeriodStart.toISOString(),
                                ),
                            );

                            const rentInvoices = buildRemainingRentInvoices(
                                stay,
                                existingBillingStarts,
                            );

                            if (rentInvoices.length > 0) {
                                await tx.invoice.createMany({
                                    data: rentInvoices.map((rentInvoice) => ({
                                        stayId: stay.id,
                                        payerId: invoice.payerId,
                                        receiverId: invoice.receiverId,
                                        type: InvoiceType.RENT,
                                        amount: new Prisma.Decimal(
                                            rentInvoice.amount,
                                        ),
                                        billingPeriodStart:
                                            rentInvoice.billingPeriodStart,
                                        billingPeriodEnd:
                                            rentInvoice.billingPeriodEnd,
                                        dueDate: rentInvoice.dueDate,
                                        status: BillStatus.PENDING,
                                        description: "Rent installment",
                                    })),
                                });
                            }
                        }
                    }
                }
            });
        }

        return updated;
    });
};

const markPaymentFailed = async (
    paymentId: string,
    gatewayResponse: any,
    failureReason: string,
) => {
    return prisma.payment.update({
        where: { id: paymentId },
        data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: gatewayResponse as Prisma.InputJsonValue,
            failureReason,
        },
    });
};

const initiatePayment = async (tenantId: string, invoiceId: string) => {
    const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, payerId: tenantId },
        include: { payer: true },
    });

    if (!invoice) {
        throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
    }

    if (invoice.status !== BillStatus.PENDING) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invoice is not payable");
    }

    if (invoice.type === InvoiceType.RENT) {
        const earlierInvoice = await prisma.invoice.findFirst({
            where: {
                stayId: invoice.stayId,
                id: { not: invoice.id },
                type: InvoiceType.RENT,
                status: {
                    in: [BillStatus.PENDING],
                },
                dueDate: { lt: invoice.dueDate },
            },
            select: { id: true, dueDate: true },
            orderBy: { dueDate: "asc" },
        });

        if (earlierInvoice) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "An earlier rent installment for this stay must be paid first",
            );
        }
    }

    const stay = await prisma.stay.findFirst({
        where: { id: invoice.stayId },
        select: { status: true },
    });

    if (stay?.status === StayStatus.WAITING_FOR_PAYMENT) {
        if (invoice.dueDate < new Date()) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Booking invoice is past its due date and can no longer be paid.",
            );
        }
    }

    const existing = await prisma.payment.findFirst({
        where: {
            invoiceId,
            status: { in: ACTIVE_PAYMENT_STATUSES },
        },
        select: { id: true },
    });

    if (existing) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Payment is already in progress for this invoice",
        );
    }

    const tranId = crypto.randomUUID();

    const paymentData = {
        store_id: config.SSL_STORE_ID,
        store_passwd: config.SSL_STORE_PASSWD,
        total_amount: Number(invoice.amount),
        currency: "BDT",
        tran_id: tranId,
        success_url: `${config.APP_URL}/api/v1/payments/confirm/success?tranId=${tranId}`,
        fail_url: `${config.APP_URL}/api/v1/payments/confirm/fail?tranId=${tranId}`,
        cancel_url: `${config.APP_URL}/api/v1/payments/confirm/cancel?tranId=${tranId}`,
        ipn_url: `${config.APP_URL}/api/v1/payments/confirm/ipn?tranId=${tranId}`,
        shipping_method: "NO",
        product_name: "Accommodation Rent",
        product_category: "Rent",
        product_profile: "general",
        cus_name: invoice.payer.name,
        cus_email: invoice.payer.email,
        cus_add1: "N/A",
        cus_add2: "N/A",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1207",
        cus_country: "Bangladesh",
        cus_phone: invoice.payer.phone || "01700000000",
        cus_fax: "01700000000",
    };

    const response = await axios.post(SSL_PAYMENT_API, paymentData, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    if (response.data.status !== "SUCCESS") {
        throw new AppError(
            httpStatus.BAD_GATEWAY,
            "Failed to initialize payment with the gateway",
        );
    }

    await prisma.payment.create({
        data: {
            stayId: invoice.stayId,
            invoiceId: invoice.id,
            payerId: tenantId,
            receiverId: invoice.receiverId,
            type: invoice.type,
            amount: invoice.amount,
            status: PaymentStatus.PENDING,
            transactionReference: tranId,
        },
    });

    return {
        gatewayUrl: response.data.GatewayPageURL,
        tranId,
    };
};

const confirmPayment = async (
    status: string,
    tranId: string,
    payload: Record<string, any>,
) => {
    const payment = await prisma.payment.findFirst({
        where: { transactionReference: tranId },
    });

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (payment.status === PaymentStatus.SUCCESS) {
        return payment;
    }

    if (status !== "success") {
        return markPaymentFailed(
            payment.id,
            payload,
            `Payment ${status} by gateway`,
        );
    }

    const response = await axios.get(SSL_VALIDATION_API, {
        params: {
            val_id: payload.val_id,
            store_id: config.SSL_STORE_ID,
            store_passwd: config.SSL_STORE_PASSWD,
            format: "json",
        },
    });

    if (response.data.status !== "VALID") {
        return markPaymentFailed(
            payment.id,
            response.data,
            "Payment validation failed",
        );
    }

    return markPaymentSuccess(payment.id, response.data);
};

const checkPayment = async (tranId: string) => {
    const payment = await prisma.payment.findFirst({
        where: { transactionReference: tranId },
    });

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (payment.status === PaymentStatus.SUCCESS) {
        return payment;
    }

    const response = await axios.get(SSL_TRANSACTION_QUERY_API, {
        params: {
            tran_id: tranId,
            store_id: config.SSL_STORE_ID,
            store_passwd: config.SSL_STORE_PASSWD,
            format: "json",
        },
    });

    const validation = response.data;

    if (validation.APIConnect !== "DONE") {
        throw new AppError(
            httpStatus.BAD_GATEWAY,
            "Unable to connect with SSLCommerz validation server",
        );
    }

    const transaction = validation.element?.[0];

    if (!transaction) {
        return markPaymentFailed(
            payment.id,
            validation,
            "Transaction not found",
        );
    }

    console.log("transaction", transaction);

    const isPaymentSuccessful =
        transaction.status === "VALID" || transaction.status === "VALIDATED";

    if (
        isPaymentSuccessful &&
        transaction.tran_id === payment.transactionReference &&
        Number(transaction.amount) === Number(payment.amount) &&
        transaction.currency?.toUpperCase() === "BDT"
    ) {
        return markPaymentSuccess(payment.id, validation);
    }

    if (transaction.status === "PROCESSING") {
        throw new AppError(httpStatus.BAD_REQUEST, "Transaction is in process");
    }

    return markPaymentFailed(
        payment.id,
        validation,
        `Payment verification failed. Status: ${transaction.status}`,
    );
};

const getMyPayments = async (tenantId: string, query: IPaymentQuery) => {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const where = { payerId: tenantId };

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                type: true,
                amount: true,
                status: true,
                transactionReference: true,
                paidAt: true,
                createdAt: true,
                invoice: {
                    select: {
                        id: true,
                        billingPeriodStart: true,
                        billingPeriodEnd: true,
                        dueDate: true,
                        status: true,
                    },
                },
                stay: {
                    select: {
                        id: true,
                        propertyId: true,
                        flatId: true,
                        roomId: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        }),
        prisma.payment.count({ where }),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(Number(total) / Number(limit)),
        },
        payments,
    };
};

const getPaymentDetails = async (tenantId: string, paymentId: string) => {
    const payment = await prisma.payment.findFirst({
        where: { id: paymentId, payerId: tenantId },
        include: {
            invoice: true,
            stay: true,
        },
    });

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    return payment;
};

export const PaymentService = {
    initiatePayment,
    confirmPayment,
    checkPayment,
    getMyPayments,
    getPaymentDetails,
};
