import { Prisma, Role } from "../../../generated/prisma/client";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
    ICreateViewingRequest,
    IUpdateViewingRequest,
    IViewingRequestQuery,
} from "./tenant.interface";

const createViewingRequest = async (
    tenantId: string,
    payload: ICreateViewingRequest,
) => {
    const advertisement = await prisma.advertisement.findUnique({
        where: { id: payload.advertisementId },
        include: {
            flat: { select: { id: true, status: true } },
            room: { select: { id: true, status: true, flatId: true } },
        },
    });

    if (!advertisement) {
        throw new AppError(httpStatus.NOT_FOUND, "Advertisement not found");
    }

    if (advertisement.status !== "PUBLISHED") {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement is not available for viewing",
        );
    }

    if (!advertisement.flatId && !advertisement.roomId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement must be linked to a flat or a room",
        );
    }

    if (advertisement.flatId && advertisement.flat?.status !== "ACTIVE") {
        throw new AppError(httpStatus.BAD_REQUEST, "Flat is not active");
    }

    if (advertisement.roomId && advertisement.room?.status !== "ACTIVE") {
        throw new AppError(httpStatus.BAD_REQUEST, "Room is not active");
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (payload.requestedDate < now) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Requested date cannot be in the past",
        );
    }

    const existing = await prisma.viewingRequest.findFirst({
        where: {
            advertisementId: payload.advertisementId,
            requesterId: tenantId,
            status: "PENDING",
        },
        select: { id: true },
    });

    if (existing) {
        throw new AppError(
            httpStatus.CONFLICT,
            "You already have a pending viewing request for this advertisement",
        );
    }

    const viewingRequest = await prisma.viewingRequest.create({
        data: {
            advertisementId: payload.advertisementId,
            requesterId: tenantId,
            requestedDate: payload.requestedDate,
            note: payload.note || null,
        },
        select: {
            id: true,
            requestedDate: true,
            status: true,
            note: true,
            createdAt: true,
            advertisement: {
                select: {
                    id: true,
                    title: true,
                    category: true,
                    target: true,
                    monthlyRent: true,
                    flatId: true,
                    roomId: true,
                },
            },
        },
    });

    return viewingRequest;
};

const applyRoleScope = (
    where: Prisma.ViewingRequestWhereInput,
    userId: string,
    role: Role,
) => {
    if (role === Role.TENANT) {
        where.requesterId = userId;
    } else if (role === Role.OWNER) {
        where.advertisement = {
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
};

const getViewingRequests = async (
    userId: string,
    role: Role,
    query: IViewingRequestQuery,
) => {
    const { status, page = 1, limit = 10 } = query;

    const where: Prisma.ViewingRequestWhereInput = {};

    if (status) {
        where.status = status;
    }

    applyRoleScope(where, userId, role);

    const total = await prisma.viewingRequest.count({ where });

    const viewingRequests = await prisma.viewingRequest.findMany({
        where,
        select: {
            id: true,
            requestedDate: true,
            status: true,
            note: true,
            reviewedById: true,
            reviewedAt: true,
            createdAt: true,
            requester: {
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
                    category: true,
                    target: true,
                    monthlyRent: true,
                    status: true,
                    flatId: true,
                    roomId: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
    });

    return {
        viewingRequests,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getViewingRequestById = async (
    userId: string,
    role: Role,
    viewingRequestId: string,
) => {
    const where: Prisma.ViewingRequestWhereInput = {
        id: viewingRequestId,
    };

    applyRoleScope(where, userId, role);

    const viewingRequest = await prisma.viewingRequest.findFirst({
        where,
        select: {
            id: true,
            advertisementId: true,
            requestedDate: true,
            status: true,
            note: true,
            reviewedById: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
            requester: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            reviewedBy: {
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
                },
            },
        },
    });

    if (!viewingRequest) {
        throw new AppError(httpStatus.NOT_FOUND, "Viewing request not found");
    }

    return viewingRequest;
};

const REVIEWER_STATUSES = ["APPROVED", "REJECTED", "COMPLETED", "NO_SHOW"];

const CLOSED_STATUSES = ["COMPLETED", "NO_SHOW", "CANCELLED"];

const updateViewingRequestStatus = async (
    userId: string,
    role: Role,
    viewingRequestId: string,
    status: string,
) => {
    const where: Prisma.ViewingRequestWhereInput = {
        id: viewingRequestId,
    };

    applyRoleScope(where, userId, role);

    const existing = await prisma.viewingRequest.findFirst({ where });

    if (!existing) {
        throw new AppError(httpStatus.NOT_FOUND, "Viewing request not found");
    }

    if (role === Role.TENANT) {
        if (status !== "CANCELLED") {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "Tenant can only cancel a viewing request",
            );
        }

        if (existing.status !== "PENDING") {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Only pending viewing requests can be cancelled",
            );
        }
    } else {
        if (!REVIEWER_STATUSES.includes(status)) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Owner/manager can only set status to APPROVED, REJECTED, COMPLETED, or NO_SHOW",
            );
        }

        if (CLOSED_STATUSES.includes(existing.status)) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "This viewing request is already closed and cannot be updated",
            );
        }
    }

    return prisma.viewingRequest.update({
        where: { id: viewingRequestId },
        data: {
            status: status as any,
            reviewedById: role === Role.TENANT ? undefined : userId,
            reviewedAt: role === Role.TENANT ? undefined : new Date(),
        },
        select: {
            id: true,
            advertisementId: true,
            requestedDate: true,
            status: true,
            note: true,
            reviewedById: true,
            reviewedAt: true,
        },
    });
};

const updateViewingRequest = async (
    userId: string,
    role: Role,
    viewingRequestId: string,
    payload: IUpdateViewingRequest,
) => {
    const where: Prisma.ViewingRequestWhereInput = {
        id: viewingRequestId,
    };

    applyRoleScope(where, userId, role);

    const existing = await prisma.viewingRequest.findFirst({ where });

    if (!existing) {
        throw new AppError(httpStatus.NOT_FOUND, "Viewing request not found");
    }

    if (CLOSED_STATUSES.includes(existing.status)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "This viewing request is already closed and cannot be updated",
        );
    }

    let status = existing.status;

    if (payload.status) {
        if (!REVIEWER_STATUSES.includes(payload.status)) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Status must be APPROVED, REJECTED, COMPLETED, or NO_SHOW",
            );
        }

        status = payload.status;
    }

    if (payload.approvedDate && status !== "APPROVED") {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "approvedDate can only be set when the request is APPROVED",
        );
    }

    return prisma.viewingRequest.update({
        where: { id: viewingRequestId },
        data: {
            status: status !== existing.status ? status : undefined,
            approvedDate: payload.approvedDate,
            noteByReviewer: payload.noteByReviewer,
            reviewedById: payload.status ? userId : undefined,
            reviewedAt:
                payload.status || payload.approvedDate
                    ? new Date()
                    : undefined,
        },
        select: {
            id: true,
            advertisementId: true,
            requestedDate: true,
            approvedDate: true,
            status: true,
            noteByReviewer: true,
            reviewedById: true,
            reviewedAt: true,
        },
    });
};

export const TenantService = {
    createViewingRequest,
    getViewingRequests,
    getViewingRequestById,
    updateViewingRequestStatus,
    updateViewingRequest,
};