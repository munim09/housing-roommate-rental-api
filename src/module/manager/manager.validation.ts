import z from "zod";

const getApplicationsValidation = z.object({
    status: z
        .enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "EXPIRED"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const ManagerValidation = {
    getApplications: getApplicationsValidation,
};