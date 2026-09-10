import z from "zod";

const createPropertyValidation = z.object({
    name: z.string().min(1, "Property name is required"),
    type: z.enum(["SINGLE_FLAT", "MULTI_FLAT"], {
        message: "Property type must be SINGLE_FLAT or MULTI_FLAT",
    }),
    description: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    areaId: z.string().uuid("Invalid area ID"),
    postalCode: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
});

const addFlatValidation = z.object({
    flatNumber: z.string().min(1, "Flat number is required"),
    floorNumber: z.coerce.number().int().optional(),
    bedrooms: z.coerce.number().int().min(0).optional(),
    bathrooms: z.coerce.number().int().min(0).optional(),
    areaSqFt: z.coerce.number().positive().optional(),
    description: z.string().optional(),
});

const addRoomValidation = z.object({
    roomNumber: z.string().min(1, "Room number is required"),
    name: z.string().optional(),
    areaSqFt: z.coerce.number().positive().optional(),
    description: z.string().optional(),
});

const assignManagerValidation = z.object({
    managerId: z.string().uuid("Invalid manager id"),
});

const updateFlatValidation = z.object({
    flatNumber: z.string().min(1, "Flat number is required").optional(),
    floorNumber: z.coerce.number().int().optional(),
    bedrooms: z.coerce.number().int().min(0).optional(),
    bathrooms: z.coerce.number().int().min(0).optional(),
    areaSqFt: z.coerce.number().positive().optional(),
    description: z.string().optional(),
});

const updateRoomValidation = z.object({
    roomNumber: z.string().min(1, "Room number is required").optional(),
    name: z.string().optional(),
    areaSqFt: z.coerce.number().positive().optional(),
    description: z.string().optional(),
});

export const OwnerValidation = {
    createProperty: createPropertyValidation,
    addFlat: addFlatValidation,
    addRoom: addRoomValidation,
    assignManager: assignManagerValidation,
    updateFlat: updateFlatValidation,
    updateRoom: updateRoomValidation,
};