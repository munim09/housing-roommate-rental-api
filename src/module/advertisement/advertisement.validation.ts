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

export const AdvertisementValidation = {
    createAdvertisement: createAdvertisementValidation,
    updateAdvertisement: updateAdvertisementValidation,
    updateAdvertisementStatus: updateAdvertisementStatusValidation,
};