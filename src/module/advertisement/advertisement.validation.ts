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

export const AdvertisementValidation = {
    createAdvertisement: createAdvertisementValidation,
};