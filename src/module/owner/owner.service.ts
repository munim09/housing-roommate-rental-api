import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { uploadImageToCloudinary } from "../../lib/cloudinary";
import { AppError } from "../../utils/AppError";
import { IAddFlat, IAddRoom, IAssignManager, ICreateProperty } from "./owner.interface";

const createProperty = async (ownerId: string, payload: ICreateProperty) => {
    const property = await prisma.property.create({
        data: {
            name: payload.name,
            type: payload.type,
            description: payload.description || null,
            address: payload.address,
            city: payload.city,
            district: payload.district,
            postalCode: payload.postalCode || null,
            latitude: payload.latitude,
            longitude: payload.longitude,
            createdById: ownerId,
        },
        select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            district: true,
            createdAt: true,
        },
    });

    return property;
};

const addFlat = async (
    ownerId: string,
    propertyId: string,
    payload: IAddFlat,
    images: Buffer[] = [],
) => {
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
    });

    if (!property) {
        throw new AppError(httpStatus.NOT_FOUND, "Property not found");
    }

    if (property.createdById !== ownerId) {
        throw new AppError(httpStatus.FORBIDDEN, "You do not own this property");
    }

    const uploadedImages = await Promise.all(
        images.map((buffer, index) =>
            uploadImageToCloudinary(buffer, "housing/flats").then((result) => ({
                url: result.url,
                isPrimary: index === 0,
            })),
        ),
    );

    const flat = await prisma.$transaction(async (tx) => {
        const createdFlat = await tx.flat.create({
            data: {
                propertyId,
                flatNumber: payload.flatNumber,
                floorNumber: payload.floorNumber || null,
                bedrooms: payload.bedrooms || null,
                bathrooms: payload.bathrooms || null,
                areaSqFt: payload.areaSqFt,
                description: payload.description || null,
            },
        });

        await tx.propertyOwnership.create({
            data: {
                flatId: createdFlat.id,
                ownerId,
                status: "ACTIVE",
            },
        });

        if (uploadedImages.length > 0) {
            await tx.accommodationImage.createMany({
                data: uploadedImages.map((img, index) => ({
                    flatId: createdFlat.id,
                    imageUrl: img.url,
                    isPrimary: img.isPrimary,
                    sortOrder: index,
                })),
            });
        }

        return createdFlat;
    });

    return {
        ...flat,
        images: uploadedImages.map((img) => img.url),
    };
};

const addRoom = async (
    ownerId: string,
    flatId: string,
    payload: IAddRoom,
    images: Buffer[] = [],
) => {
    const ownership = await prisma.propertyOwnership.findFirst({
        where: {
            flatId,
            ownerId,
            status: "ACTIVE",
        },
    });

    if (!ownership) {
        throw new AppError(httpStatus.FORBIDDEN, "You do not own this flat");
    }

    const flat = await prisma.flat.findUnique({ where: { id: flatId } });

    if (!flat) {
        throw new AppError(httpStatus.NOT_FOUND, "Flat not found");
    }

    const uploadedImages = await Promise.all(
        images.map((buffer, index) =>
            uploadImageToCloudinary(buffer, "housing/rooms").then((result) => ({
                url: result.url,
                isPrimary: index === 0,
            })),
        ),
    );

    const room = await prisma.$transaction(async (tx) => {
        const createdRoom = await tx.room.create({
            data: {
                flatId,
                roomNumber: payload.roomNumber,
                name: payload.name || null,
                areaSqFt: payload.areaSqFt,
                description: payload.description || null,
            },
        });

        if (uploadedImages.length > 0) {
            await tx.accommodationImage.createMany({
                data: uploadedImages.map((img, index) => ({
                    roomId: createdRoom.id,
                    imageUrl: img.url,
                    isPrimary: img.isPrimary,
                    sortOrder: index,
                })),
            });
        }

        return createdRoom;
    });

    return {
        ...room,
        images: uploadedImages.map((img) => img.url),
    };
};

const assignManager = async (ownerId: string, flatId: string, payload: IAssignManager) => {
    const ownership = await prisma.propertyOwnership.findFirst({
        where: {
            flatId,
            ownerId,
            status: "ACTIVE",
        },
    });

    if (!ownership) {
        throw new AppError(httpStatus.FORBIDDEN, "You do not own this flat");
    }

    const flat = await prisma.flat.findUnique({ where: { id: flatId } });

    if (!flat) {
        throw new AppError(httpStatus.NOT_FOUND, "Flat not found");
    }

    const manager = await prisma.user.findUnique({
        where: { id: payload.managerId },
    });

    if (!manager || manager.role !== "MANAGER") {
        throw new AppError(httpStatus.BAD_REQUEST, "Manager does not exist");
    }

    if (manager.status !== "ACTIVE") {
        throw new AppError(httpStatus.BAD_REQUEST, "Manager account is not active");
    }

    const assignment = await prisma.$transaction(async (tx) => {
        await tx.managerAssignment.updateMany({
            where: { flatId, status: "ACTIVE" },
            data: { status: "ENDED", endedAt: new Date() },
        });

        return tx.managerAssignment.create({
            data: {
                flatId,
                managerId: manager.id,
                status: "ACTIVE",
            },
        });
    });

    return assignment;
};

const getMyProperties = async (ownerId: string) => {
    const properties = await prisma.property.findMany({
        where: { createdById: ownerId },
        select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            district: true,
            status: true,
            createdAt: true,
            flats: {
                select: {
                    id: true,
                    flatNumber: true,
                    floorNumber: true,
                    bedrooms: true,
                    bathrooms: true,
                    status: true,
                    rooms: {
                        select: {
                            id: true,
                            roomNumber: true,
                            name: true,
                            status: true,
                        },
                    },
                },
            },
        },
    });

    return properties;
};

const getMyFlats = async (ownerId: string) => {
    const flats = await prisma.propertyOwnership.findMany({
        where: { ownerId, status: "ACTIVE" },
        select: {
            id: true,
            flatId: true,
            status: true,
            flat: {
                select: {
                    id: true,
                    flatNumber: true,
                    floorNumber: true,
                    bedrooms: true,
                    bathrooms: true,
                    areaSqFt: true,
                    status: true,
                    property: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                        },
                    },
                    rooms: {
                        select: {
                            id: true,
                            roomNumber: true,
                            name: true,
                            status: true,
                        },
                    },
                    images: {
                        orderBy: { sortOrder: "asc" },
                        select: {
                            id: true,
                            imageUrl: true,
                            isPrimary: true,
                        },
                    },
                    managerAssignments: {
                        where: { status: "ACTIVE" },
                        select: {
                            id: true,
                            manager: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    return flats;
};

export const OwnerService = {
    createProperty,
    addFlat,
    addRoom,
    assignManager,
    getMyProperties,
    getMyFlats,
};