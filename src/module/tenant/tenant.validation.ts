import z from "zod";

const createViewingRequestValidation = z.object({
    advertisementId: z.string().uuid("Invalid advertisement id"),
    requestedDate: z.coerce.date("Requested date is required"),
    note: z.string().max(500, "Note must be at most 500 characters").optional(),
});

const getViewingRequestsValidation = z.object({
    status: z
        .enum([
            "PENDING",
            "APPROVED",
            "REJECTED",
            "CANCELLED",
            "COMPLETED",
            "NO_SHOW",
        ])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

const updateViewingRequestStatusValidation = z.object({
    status: z.enum([
        "APPROVED",
        "REJECTED",
        "COMPLETED",
        "NO_SHOW",
        "CANCELLED",
    ]),
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
    .refine((data) => data.status || data.approvedDate || data.noteByReviewer, {
        message:
            "At least one of status, approvedDate, or noteByReviewer must be provided",
    });

const dateOnly = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((value) => !isNaN(Date.parse(value)), {
        message: "Invalid date",
    })
    .transform((value) => new Date(`${value}T00:00:00.000Z`));

const createApplicationValidation = z
    .object({
        advertisementId: z.string().uuid("Invalid advertisement id"),
        requestedStartDate: dateOnly,
        requestedEndDate: dateOnly,
        note: z
            .string()
            .max(500, "Note must be at most 500 characters")
            .optional(),
    })
    .refine((data) => data.requestedEndDate > data.requestedStartDate, {
        message: "End date must be after start date",
    });

const getApplicationsValidation = z.object({
    status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "EXPIRED"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

const updateApplicationValidation = z.object({
    status: z.enum(["APPROVED", "REJECTED", "WITHDRAWN"], {
        message: "Status must be APPROVED, REJECTED, or WITHDRAWN",
    }),
    details: z.record(z.string(), z.unknown()).optional(),
});

const getInvoicesValidation = z.object({
    status: z
        .enum(["PENDING", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

const getStayInvoicesValidation = z.object({
    query: z
        .object({
            applicationId: z.string().uuid("Invalid application id").optional(),
            stayId: z.string().uuid("Invalid stay id").optional(),
        })
        .refine((data) => data.applicationId || data.stayId, {
            message: "Either applicationId or stayId is required",
        }),
});

const createMaintenanceRequestValidation = z.object({
    stayId: z.string().uuid("Invalid stay id"),
    issue: z
        .string()
        .min(3, "Issue must be at least 3 characters")
        .max(500, "Issue must be at most 500 characters"),
    description: z
        .string()
        .max(1000, "Description must be at most 1000 characters")
        .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

const getMaintenanceRequestsValidation = z.object({
    status: z
        .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"])
        .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const TenantValidation = {
    createViewingRequest: createViewingRequestValidation,
    getViewingRequests: getViewingRequestsValidation,
    updateViewingRequestStatus: updateViewingRequestStatusValidation,
    updateViewingRequest: updateViewingRequestValidation,
    createApplication: createApplicationValidation,
    getApplications: getApplicationsValidation,
    updateApplication: updateApplicationValidation,
    getInvoices: getInvoicesValidation,
    getStayInvoices: getStayInvoicesValidation,
    createMaintenanceRequest: createMaintenanceRequestValidation,
    getMaintenanceRequests: getMaintenanceRequestsValidation,
};
