import {
    ManagerAssignmentStatus,
    Prisma,
    Role,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { IManagerApplicationQuery } from "./manager.interface";

const getMyAdvertisements = async (managerId: string) => {
    const assignedFlatIds = (
        await prisma.managerAssignment.findMany({
            where: { managerId, status: ManagerAssignmentStatus.ACTIVE },
            select: { flatId: true },
        })
    ).map((assignment) => assignment.flatId);

    if (assignedFlatIds.length === 0) {
        return [];
    }

    const advertisements = await prisma.advertisement.findMany({
        where: {
            OR: [
                { flatId: { in: assignedFlatIds } },
                { room: { flatId: { in: assignedFlatIds } } },
            ],
        },
        select: {
            id: true,
            title: true,
            description: true,
            monthlyRent: true,
            category: true,
            target: true,
            status: true,
            availableFrom: true,
            availableTo: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            flat: {
                select: {
                    id: true,
                    flatNumber: true,
                    floorNumber: true,
                    status: true,
                    property: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            district: true,
                        },
                    },
                },
            },
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                    name: true,
                    status: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return advertisements;
};

const getApplications = async (
    userId: string,
    role: Role,
    query: IManagerApplicationQuery,
) => {
    const { status, page = 1, limit = 10 } = query;

    const where: Prisma.ApplicationWhereInput = {};

    if (status) {
        where.status = status;
    }

    if (role === Role.OWNER) {
        where.advertisement = {
            category: "RENTAL",
            OR: [
                { createdById: userId },
                {
                    flat: {
                        ownerships: {
                            some: { ownerId: userId, status: "ACTIVE" },
                        },
                    },
                },
                {
                    room: {
                        flat: {
                            ownerships: {
                                some: { ownerId: userId, status: "ACTIVE" },
                            },
                        },
                    },
                },
            ],
        };
    } else {
        where.advertisement = {
            category: "RENTAL",
            OR: [
                { createdById: userId },
                {
                    flat: {
                        managerAssignments: {
                            some: { managerId: userId, status: "ACTIVE" },
                        },
                    },
                },
                {
                    room: {
                        flat: {
                            managerAssignments: {
                                some: { managerId: userId, status: "ACTIVE" },
                            },
                        },
                    },
                },
            ],
        };
    }

    const total = await prisma.application.count({ where });

    const applications = await prisma.application.findMany({
        where,
        select: {
            id: true,
            type: true,
            status: true,
            requestedStartDate: true,
            requestedEndDate: true,
            note: true,
            reviewedById: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
            applicant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            advertisement: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    target: true,
                    monthlyRent: true,
                    status: true,
                    flatId: true,
                    roomId: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            },
            stay: {
                select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    return {
        applications,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(Number(total) / Number(limit)),
        },
    };
};

export const ManagerService = {
    getMyAdvertisements,
    getApplications,
};
