import z from "zod";

const createAdvertisementValidation = z
    .object({
        stayId: z.string().uuid("Invalid stay ID"),
        roomId: z.string().uuid("Invalid room ID"),
        title: z.string().min(1, "Advertisement title is required"),
        advertisementTarget: z.enum(
            ["SECONDARY_ROOM", "SECONDARY_ROOM_SHARING"],
            {
                message: "Advertisement target must be ROOM or ROOM_SHARING",
            },
        ),
        description: z
            .string()
            .max(2000, "Description must be at most 2000 characters")
            .optional(),
        monthlyRent: z.coerce
            .number()
            .positive("Monthly rent must be greater than 0"),
        availableFrom: z.coerce.date("Available from date is required"),
        availableTo: z.coerce.date("Available to date is required"),
    })
    .refine((data) => data.availableTo > data.availableFrom, {
        message: "Available to must be after available from",
    });

const updateApplicationStatusValidation = z.object({
    status: z.enum(["APPROVED", "REJECTED"], {
        message: "Status must be APPROVED or REJECTED",
    }),
});

export const RoommateValidation = {
    createAdvertisement: createAdvertisementValidation,
    updateApplicationStatus: updateApplicationStatusValidation,
};
