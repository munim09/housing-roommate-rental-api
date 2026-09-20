import httpStatus from "http-status";
import {
    BillStatus,
    InvoiceType,
    MaintenanceStatus,
    ManagerAssignmentStatus,
    Prisma,
    RentalType,
    Role,
    StayStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
    ICreateUtilityInvoice,
    IManagerApplicationQuery,
    IManagerMaintenanceRequestQuery,
    IUpdateMaintenanceRequest,
    IUpdateUtilityInvoice,
} from "./manager.interface";

const getMyFlats = async (managerId: string) => {
    const assignments = await prisma.managerAssignment.findMany({
        where: {
            managerId,
            status: ManagerAssignmentStatus.ACTIVE,
        },
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
                            area: true,
                        },
                    },
                    rooms: {
                        select: {
                            id: true,
                            roomNumber: true,
                            name: true,
                            status: true,
                            images: {
                                orderBy: { sortOrder: "asc" },
                                select: {
                                    id: true,
                                    imageUrl: true,
                                    isPrimary: true,
                                },
                            },
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
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    if (assignments.length === 0) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not assigned to manage any flat",
        );
    }

    return assignments;
};

const getMyAdvertisements = async (managerId: string) => {
    const assignedFlatIds = (
        await prisma.managerAssignment.findMany({
            where: { managerId, status: ManagerAssignmentStatus.ACTIVE },
            select: { flatId: true },
        })
    ).map((assignment) => assignment.flatId);

    if (assignedFlatIds.length === 0) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not assigned to manage any flat",
        );
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
            rentalType: true,
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
            rentalType: {
                in: [RentalType.PRIMARY_ENTIRE_FLAT, RentalType.PRIMARY_ROOM],
            },
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
            rentalType: {
                in: [RentalType.PRIMARY_ENTIRE_FLAT, RentalType.PRIMARY_ROOM],
            },
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
            rentalType: true,
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
                    rentalType: true,
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

const assertUtilityInvoiceAccess = async (
    userId: string,
    role: Role,
    flatId: string,
) => {
    if (role === Role.MANAGER) {
        const assignment = await prisma.managerAssignment.findFirst({
            where: {
                managerId: userId,
                flatId,
                status: ManagerAssignmentStatus.ACTIVE,
            },
        });

        if (!assignment) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You are not assigned to manage this flat",
            );
        }
    }

    const ownership = await prisma.propertyOwnership.findFirst({
        where: {
            flatId,
            status: "ACTIVE",
        },
    });

    if (!ownership) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "No active owner found for this flat",
        );
    }

    if (role === Role.OWNER && ownership.ownerId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, "You do not own this flat");
    }

    return ownership;
};

const createUtilityInvoice = async (
    userId: string,
    role: Role,
    payload: ICreateUtilityInvoice,
) => {
    const {
        stayId,
        amount,
        billingPeriodStart,
        billingPeriodEnd,
        description,
    } = payload;

    const stay = await prisma.stay.findUnique({
        where: { id: stayId },
        include: {
            flat: true,
            occupant: { select: { id: true, role: true } },
            application: {
                include: {
                    advertisement: true,
                },
            },
        },
    });

    if (!stay) {
        throw new AppError(httpStatus.NOT_FOUND, "Stay not found");
    }

    if (stay.status !== StayStatus.CONFIRMED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Can only create utility invoices for confirmed stays",
        );
    }

    const payerId = stay.occupantId;

    if (stay.occupant.role !== "TENANT") {
        throw new AppError(httpStatus.BAD_REQUEST, "Payer must be a tenant");
    }

    const ownership = await assertUtilityInvoiceAccess(
        userId,
        role,
        stay.flatId,
    );

    if (billingPeriodStart >= billingPeriodEnd) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Billing period start must be before end",
        );
    }

    let receiverId;
    if (
        stay.rentalType === RentalType.PRIMARY_ENTIRE_FLAT ||
        stay.rentalType === RentalType.PRIMARY_ROOM
    ) {
        receiverId = ownership.ownerId;
    } else {
        receiverId = stay.application.advertisement.createdById;
    }

    const invoice = await prisma.invoice.create({
        data: {
            stayId,
            payerId,
            receiverId: receiverId,
            type: InvoiceType.UTILITY,
            amount,
            billingPeriodStart,
            billingPeriodEnd,
            status: BillStatus.PENDING,
            description,
        },
        include: {
            stay: {
                select: {
                    id: true,
                    flat: { select: { id: true, flatNumber: true } },
                },
            },
            payer: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } },
        },
    });

    return invoice;
};

const updateUtilityInvoice = async (
    userId: string,
    role: Role,
    invoiceId: string,
    payload: IUpdateUtilityInvoice,
) => {
    const {
        amount,
        billingPeriodStart,
        billingPeriodEnd,
        description,
        status,
    } = payload;

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { stay: true },
    });

    if (!invoice) {
        throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
    }

    if (invoice.type !== InvoiceType.UTILITY) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only utility invoices can be updated here",
        );
    }

    if (invoice.status === BillStatus.PAID) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Paid invoices cannot be updated",
        );
    }

    await assertUtilityInvoiceAccess(userId, role, invoice.stay.flatId);

    const effectiveStart = billingPeriodStart ?? invoice.billingPeriodStart;
    const effectiveEnd = billingPeriodEnd ?? invoice.billingPeriodEnd;
    const amount_new = amount ?? invoice.amount;
    const description_new = description ?? invoice.description;
    const status_new = status ?? invoice.status;

    if (effectiveStart >= effectiveEnd) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Billing period start must be before end",
        );
    }

    const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            amount: amount_new,
            billingPeriodStart: effectiveStart,
            billingPeriodEnd: effectiveEnd,
            description: description_new,
            status: status_new,
        },
        include: {
            stay: {
                select: {
                    id: true,
                    flat: { select: { id: true, flatNumber: true } },
                },
            },
            payer: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } },
        },
    });

    return updatedInvoice;
};

const getMaintenanceRequests = async (
    userId: string,
    role: Role,
    query: IManagerMaintenanceRequestQuery,
) => {
    // const { status, priority, stayId, page = 1, limit = 10 } = query;

    const where: Prisma.MaintenanceWhereInput = {};

    // if (status) {
    //     where.status = status;
    // }

    // if (priority) {
    //     where.priority = priority;
    // }

    // if (stayId) {
    //     where.stayId = stayId;
    // }

    if (role === Role.OWNER) {
        where.stay = {
            rentalType: {
                in: [RentalType.PRIMARY_ENTIRE_FLAT, RentalType.PRIMARY_ROOM],
            },
            flat: {
                ownerships: {
                    some: { ownerId: userId, status: "ACTIVE" },
                },
            },
        };
    } else {
        where.stay = {
            rentalType: {
                in: [RentalType.PRIMARY_ENTIRE_FLAT, RentalType.PRIMARY_ROOM],
            },
            flat: {
                managerAssignments: {
                    some: { managerId: userId, status: "ACTIVE" },
                },
            },
        };
    }

    const total = await prisma.maintenance.count({ where });

    const maintenanceRequests = await prisma.maintenance.findMany({
        where,
        select: {
            id: true,
            stayId: true,
            issue: true,
            description: true,
            images: true,
            status: true,
            priority: true,
            reportedById: true,

            scheduledFor: true,
            resolvedAt: true,
            createdAt: true,
            updatedAt: true,
            stay: {
                select: {
                    id: true,
                    status: true,
                    rentalType: true,
                    property: {
                        select: { id: true, name: true, address: true },
                    },
                    flat: {
                        select: { id: true, flatNumber: true },
                    },
                    room: {
                        select: { id: true, roomNumber: true },
                    },
                },
            },
            reportedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return {
        maintenanceRequests,
    };
};

const assertMaintenanceAccess = async (
    userId: string,
    role: Role,
    flatId: string,
) => {
    if (role === Role.OWNER) {
        const ownership = await prisma.propertyOwnership.findFirst({
            where: { flatId, ownerId: userId, status: "ACTIVE" },
        });

        if (!ownership) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You do not own this flat",
            );
        }
    } else {
        const assignment = await prisma.managerAssignment.findFirst({
            where: { flatId, managerId: userId, status: "ACTIVE" },
        });

        if (!assignment) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You are not assigned to manage this flat",
            );
        }
    }
};

const updateMaintenanceRequest = async (
    userId: string,
    role: Role,
    maintenanceId: string,
    payload: IUpdateMaintenanceRequest,
) => {
    const { status, scheduledFor, resolvedAt } = payload;

    const maintenance = await prisma.maintenance.findUnique({
        where: { id: maintenanceId },
        include: { stay: { select: { id: true, flatId: true } } },
    });

    if (!maintenance) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Maintenance request not found",
        );
    }

    await assertMaintenanceAccess(userId, role, maintenance.stay.flatId);

    let effectiveResolvedAt: Date | null | undefined = resolvedAt;

    if (status) {
        if (
            status === MaintenanceStatus.RESOLVED ||
            status === MaintenanceStatus.CLOSED
        ) {
            effectiveResolvedAt = effectiveResolvedAt ?? new Date();
        } else if (effectiveResolvedAt === undefined) {
            effectiveResolvedAt = null;
        }
    }

    return prisma.maintenance.update({
        where: { id: maintenanceId },
        data: {
            status: status ?? maintenance.status,
            scheduledFor: scheduledFor ?? maintenance.scheduledFor,
            resolvedAt: effectiveResolvedAt ?? maintenance.resolvedAt,
        },
        select: {
            id: true,
            stayId: true,
            issue: true,
            description: true,
            status: true,
            priority: true,
            reportedById: true,
            scheduledFor: true,
            resolvedAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

export const ManagerService = {
    getMyFlats,
    getMyAdvertisements,
    getApplications,
    createUtilityInvoice,
    updateUtilityInvoice,
    getMaintenanceRequests,
    updateMaintenanceRequest,
};
