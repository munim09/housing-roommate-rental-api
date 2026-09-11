import z from "zod";

const createViewingRequestValidation = z.object({
    advertisementId: z.string().uuid("Invalid advertisement id"),
    requestedDate: z.coerce.date("Requested date is required"),
    note: z.string().max(500, "Note must be at most 500 characters").optional(),
});

const getViewingRequestsValidation = z.object({
    status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

const updateViewingRequestStatusValidation = z.object({
    status: z.enum(["APPROVED", "REJECTED", "COMPLETED", "NO_SHOW", "CANCELLED"]),
});

const updateViewingRequestValidation = z
    .object({
        status: z
            .enum(["APPROVED", "REJECTED", "COMPLETED", "NO_SHOW"])
            .optional(),
        approvedDate: z.coerce.date().optional(),
        noteByReviewer: z
            .string()
            .max(500, "Note must be at most 500 characters")
            .optional(),
    })
    .refine(
        (data) => data.status || data.approvedDate || data.noteByReviewer,
        {
            message:
                "At least one of status, approvedDate, or noteByReviewer must be provided",
        },
    );

export const TenantValidation = {
    createViewingRequest: createViewingRequestValidation,
    getViewingRequests: getViewingRequestsValidation,
    updateViewingRequestStatus: updateViewingRequestStatusValidation,
    updateViewingRequest: updateViewingRequestValidation,
};