import z from "zod";

const getApplicationsValidation = z.object({
    status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "EXPIRED"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

const createUtilityInvoiceValidation = z.object({
    stayId: z.string().uuid("Invalid stay ID"),
    amount: z.coerce.number().positive("Amount must be a positive number"),
    billingPeriodStart: z.coerce.date(),
    billingPeriodEnd: z.coerce.date(),
    description: z.string().optional(),
});

const updateUtilityInvoiceValidation = z.object({
    body: z
        .object({
            amount: z.coerce
                .number()
                .positive("Amount must be a positive number")
                .optional(),
            billingPeriodStart: z.coerce.date().optional(),
            billingPeriodEnd: z.coerce.date().optional(),
            description: z.string().optional(),
            status: z.enum(["PENDING", "CANCELLED"]).optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field must be provided",
        }),
    params: z.object({
        invoiceId: z.string().uuid("Invalid invoice ID"),
    }),
});

export const ManagerValidation = {
    getApplications: getApplicationsValidation,
    createUtilityInvoice: createUtilityInvoiceValidation,
    updateUtilityInvoice: updateUtilityInvoiceValidation,
};