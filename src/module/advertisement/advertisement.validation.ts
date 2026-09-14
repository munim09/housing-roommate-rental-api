import z from "zod";

const createAdvertisementValidation = z.object({
    title: z.string().min(1, "Advertisement title is required"),
    description: z.string().optional(),
    monthlyRent: z.coerce
        .number()
        .positive("Monthly rent must be greater than 0"),
    availableFrom: z.coerce.date("Available from date is required"),
    availableTo: z.coerce.date("Available to date is required"),
});

const updateAdvertisementValidation = z.object({
    title: z.string().min(1, "Title must be at least 1 character").optional(),
    description: z.string().nullable().optional(),
    monthlyRent: z.coerce
        .number()
        .positive("Monthly rent must be greater than 0")
        .optional(),
    availableFrom: z.coerce.date("Available from date is required").optional(),
    availableTo: z.coerce.date("Available to date is required").optional(),
});

const updateAdvertisementStatusValidation = z.object({
    status: z.enum(["PUBLISHED", "UNPUBLISHED", "ARCHIVED"]),
});

const createUtilityInvoice = z.object({
    stayId: z.string().uuid("Invalid stay ID"),
    amount: z.coerce.number().positive("Amount must be a positive number"),
    billingPeriodStart: z.coerce.date(),
    billingPeriodEnd: z.coerce.date(),
    description: z.string().optional(),
});

const updateUtilityInvoice = z.object({
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

export const AdvertisementValidation = {
    createAdvertisement: createAdvertisementValidation,
    updateAdvertisement: updateAdvertisementValidation,
    updateAdvertisementStatus: updateAdvertisementStatusValidation,
    createUtilityInvoice,
    updateUtilityInvoice,
};
