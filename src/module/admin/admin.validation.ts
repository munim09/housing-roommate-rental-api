import z from "zod";

const getAllUsersValidation = z.object({
    role: z.enum(["OWNER", "MANAGER", "TENANT", "ADMIN"]).optional(),
    status: z.enum(["PENDING_APPROVAL", "ACTIVE", "REJECTED", "SUSPENDED"]).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["name", "email", "createdAt", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const updateStatusValidation = z.object({
    status: z.enum(["ACTIVE", "SUSPENDED", "REJECTED"], {
        message: "Status must be ACTIVE, SUSPENDED, or REJECTED",
    }),
});

const updateRoleValidation = z.object({
    role: z.enum(["OWNER", "MANAGER", "TENANT"], {
        message: "Role must be OWNER, MANAGER, or TENANT",
    }),
});

const createCityValidation = z.object({
    name: z
        .string()
        .min(1, "City name is required")
        .max(100, "City name must be at most 100 characters"),
});

const createAreaValidation = z.object({
    cityId: z.string().uuid("Invalid city ID"),
    name: z
        .string()
        .min(1, "Area name is required")
        .max(100, "Area name must be at most 100 characters"),
});

export const AdminValidation = {
    getAllUsers: getAllUsersValidation,
    updateStatus: updateStatusValidation,
    updateRole: updateRoleValidation,
    createCity: createCityValidation,
    createArea: createAreaValidation,
};
