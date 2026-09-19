import z from "zod";
import { AdvertisementStatus } from "../../../generated/prisma/enums";

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

const updateAdvertisementValidation = z.object({
    body: z
        .object({
            title: z
                .string()
                .min(1, "Title must be at least 1 character")
                .optional(),
            advertisementTarget: z
                .enum(["SECONDARY_ROOM", "SECONDARY_ROOM_SHARING"], {
                    message:
                        "Advertisement target must be ROOM or ROOM_SHARING",
                })
                .optional(),
            status: z
                .enum(
                    [
                        AdvertisementStatus.DRAFT,
                        AdvertisementStatus.PUBLISHED,
                        AdvertisementStatus.EXPIRED,
                        AdvertisementStatus.PUBLISHED,
                        AdvertisementStatus.RENTED,
                        AdvertisementStatus.UNPUBLISHED,
                    ],
                    {
                        message: "Invalid status",
                    },
                )
                .optional(),
            description: z.string().nullable().optional(),
            monthlyRent: z.coerce
                .number()
                .positive("Monthly rent must be greater than 0")
                .optional(),
            availableFrom: z.coerce.date().optional(),
            availableTo: z.coerce.date().optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field must be provided",
        }),
    params: z.object({
        advertisementId: z.string().uuid("Invalid advertisement ID"),
    }),
});

const updateApplicationStatusValidation = z.object({
    status: z.enum(["APPROVED", "REJECTED"], {
        message: "Status must be APPROVED or REJECTED",
    }),
});

const createUtilityBillValidation = z.object({
    body: z.object({
        amount: z.coerce.number().positive("Amount must be a positive number"),
        billingPeriodStart: z.coerce.date(),
        billingPeriodEnd: z.coerce.date(),
        description: z.string().optional(),
    }),
    params: z.object({
        stayId: z.string().uuid("Invalid stay ID"),
    }),
});

const updateUtilityBillValidation = z.object({
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
        billId: z.string().uuid("Invalid bill ID"),
    }),
});

export const RoommateValidation = {
    createAdvertisement: createAdvertisementValidation,
    updateAdvertisement: updateAdvertisementValidation,
    updateApplicationStatus: updateApplicationStatusValidation,
    createUtilityBill: createUtilityBillValidation,
    updateUtilityBill: updateUtilityBillValidation,
};
