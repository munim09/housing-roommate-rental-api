import httpStatus from "http-status";
import {
    AdvertisementCategory,
    AdvertisementStatus,
    ApplicationStatus,
    BillStatus,
    FlatStatus,
    InvoiceType,
    Prisma,
    Role,
    StayStatus,
    StayType,
    ViewingRequestStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
    IApplicationQuery,
    ICreateApplication,
    ICreateViewingRequest,
    IInvoiceQuery,
    IStayInvoiceQuery,
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

    if (advertisement.status !== AdvertisementStatus.PUBLISHED) {
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

    if (
        advertisement.flatId &&
        advertisement.flat?.status !== FlatStatus.ACTIVE
    ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Flat is not active");
    }

    if (
        advertisement.roomId &&
        advertisement.room?.status !== FlatStatus.ACTIVE
    ) {
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
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    return {
        viewingRequests,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(Number(total) / Number(limit)),
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

const REVIEWER_STATUSES: ViewingRequestStatus[] = [
    ViewingRequestStatus.APPROVED,
    ViewingRequestStatus.REJECTED,
    ViewingRequestStatus.COMPLETED,
    ViewingRequestStatus.NO_SHOW,
];

const CLOSED_STATUSES: ViewingRequestStatus[] = [
    ViewingRequestStatus.CANCELLED,
    ViewingRequestStatus.COMPLETED,
    ViewingRequestStatus.NO_SHOW,
];

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
        if (status !== ViewingRequestStatus.CANCELLED) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "Tenant can only cancel a viewing request",
            );
        }

        if (existing.status !== ViewingRequestStatus.PENDING) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Only pending viewing requests can be cancelled",
            );
        }
    } else {
        if (!REVIEWER_STATUSES.includes(status as ViewingRequestStatus)) {
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
        if (
            !REVIEWER_STATUSES.includes(payload.status as ViewingRequestStatus)
        ) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Status must be APPROVED, REJECTED, COMPLETED, or NO_SHOW",
            );
        }

        status = payload.status;
    }

    if (payload.approvedDate && status !== ViewingRequestStatus.APPROVED) {
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
                payload.status || payload.approvedDate ? new Date() : undefined,
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

const createApplication = async (
    tenantId: string,
    payload: ICreateApplication,
) => {
    const advertisement = await prisma.advertisement.findUnique({
        where: {
            id: payload.advertisementId,
            status: AdvertisementStatus.PUBLISHED,
        },
        include: {
            flat: { select: { id: true, status: true } },
            room: { select: { id: true, status: true, flatId: true } },
        },
    });

    if (!advertisement) {
        throw new AppError(httpStatus.NOT_FOUND, "Advertisement not found");
    }

    if (advertisement.status !== AdvertisementStatus.PUBLISHED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement is not available for application",
        );
    }

    if (!advertisement.flatId && !advertisement.roomId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement must be linked to a flat or a room",
        );
    }

    if (
        advertisement.flatId &&
        advertisement.flat?.status !== FlatStatus.ACTIVE
    ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Flat is not active");
    }

    if (
        advertisement.roomId &&
        advertisement.room?.status !== FlatStatus.ACTIVE
    ) {
        throw new AppError(httpStatus.BAD_REQUEST, "Room is not active");
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (payload.requestedStartDate < now) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Start date cannot be in the past",
        );
    }

    if (payload.requestedEndDate <= payload.requestedStartDate) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "End date must be after start date",
        );
    }

    if (
        advertisement.availableFrom &&
        payload.requestedStartDate < advertisement.availableFrom
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Start date is outside the advertisement availability",
        );
    }

    if (
        advertisement.availableTo &&
        payload.requestedEndDate > advertisement.availableTo
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "End date is outside the advertisement availability",
        );
    }

    // Check there is no stay record

    const existingTenantApplication = await prisma.application.findFirst({
        where: {
            advertisementId: payload.advertisementId,
            applicantId: tenantId,
            status: "PENDING",
        },
        select: { id: true },
    });

    if (existingTenantApplication) {
        throw new AppError(
            httpStatus.CONFLICT,
            "You already have a pending application for this advertisement",
        );
    }

    const overlappingApplication = await prisma.application.findFirst({
        where: {
            advertisementId: payload.advertisementId,
            status: {
                in: [ApplicationStatus.PENDING, ApplicationStatus.APPROVED],
            },
            AND: [
                {
                    requestedStartDate: {
                        lte: payload.requestedEndDate,
                    },
                },
                {
                    requestedEndDate: {
                        gte: payload.requestedStartDate,
                    },
                },
            ],
        },
        select: { id: true },
    });

    if (overlappingApplication) {
        throw new AppError(
            httpStatus.CONFLICT,
            "There is already an application for this advertisement with an overlapping stay period",
        );
    }

    const advertisementFlatId =
        advertisement.flatId ?? advertisement.room?.flatId;

    if (!advertisementFlatId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement must be linked to a flat or a room",
        );
    }

    if (advertisement.category === AdvertisementCategory.ROOMMATE) {
        if (!advertisement.roomId) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Roommate advertisement must be linked to a room",
            );
        }

        const advertiserStay = await prisma.stay.findFirst({
            where: {
                occupantId: advertisement.createdById,
                flatId: advertisementFlatId,
                status: StayStatus.CONFIRMED,
            },
            select: { id: true, startDate: true, endDate: true },
        });

        if (!advertiserStay) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "The advertiser's stay is not confirmed",
            );
        }

        if (
            payload.requestedStartDate < advertiserStay.startDate ||
            payload.requestedEndDate > advertiserStay.endDate
        ) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Requested stay must be within the advertiser's stay period",
            );
        }

        const conflictingRoommateStay = await prisma.stay.findFirst({
            where: {
                roomId: advertisement.roomId,
                type: StayType.ROOMMATE,
                occupantId: { not: advertisement.createdById },
                status: {
                    in: [StayStatus.WAITING_FOR_PAYMENT, StayStatus.CONFIRMED],
                },
                startDate: { lte: payload.requestedEndDate },
                endDate: { gte: payload.requestedStartDate },
            },
            select: { id: true },
        });

        if (conflictingRoommateStay) {
            throw new AppError(
                httpStatus.CONFLICT,
                "This room already has an active roommate for the requested period",
            );
        }
    } else {
        const stayConflictWhere: Prisma.StayWhereInput = {
            status: {
                in: [StayStatus.WAITING_FOR_PAYMENT, StayStatus.CONFIRMED],
            },
            startDate: { lte: payload.requestedEndDate },
            endDate: { gte: payload.requestedStartDate },
        };

        if (advertisement.roomId) {
            stayConflictWhere.OR = [
                { flatId: advertisementFlatId, roomId: null },
                { roomId: advertisement.roomId },
            ];
        } else {
            stayConflictWhere.flatId = advertisementFlatId;
        }

        const conflictingStay = await prisma.stay.findFirst({
            where: stayConflictWhere,
            select: { id: true },
        });

        if (conflictingStay) {
            throw new AppError(
                httpStatus.CONFLICT,
                "There is already a booking in this period for this property",
            );
        }
    }

    const application = await prisma.application.create({
        data: {
            advertisementId: payload.advertisementId,
            applicantId: tenantId,
            type:
                advertisement.category === AdvertisementCategory.ROOMMATE
                    ? "ROOMMATE"
                    : "RENTAL",
            requestedStartDate: payload.requestedStartDate,
            requestedEndDate: payload.requestedEndDate,
            note: payload.note || null,
        },
        select: {
            id: true,
            type: true,
            status: true,
            requestedStartDate: true,
            requestedEndDate: true,
            note: true,
            createdAt: true,
            advertisement: {
                select: {
                    id: true,
                    title: true,
                    category: true,
                    target: true,
                    monthlyRent: true,
                },
            },
        },
    });

    return application;
};

const getApplications = async (userId: string, query: IApplicationQuery) => {
    const { status, page = 1, limit = 10 } = query;

    const where: Prisma.ApplicationWhereInput = {
        applicantId: userId,
    };

    if (status) {
        where.status = status;
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

const applyApplicationRoleScope = (
    where: Prisma.ApplicationWhereInput,
    userId: string,
    role: Role,
) => {
    if (role === Role.TENANT) {
        where.applicantId = userId;
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

const getApplicationById = async (
    userId: string,
    role: Role,
    applicationId: string,
) => {
    const where: Prisma.ApplicationWhereInput = {
        id: applicationId,
    };

    applyApplicationRoleScope(where, userId, role);

    const application = await prisma.application.findFirst({
        where,
        select: {
            id: true,
            advertisementId: true,
            applicantId: true,
            type: true,
            status: true,
            requestedStartDate: true,
            requestedEndDate: true,
            note: true,
            reviewedById: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
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
            applicant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    tenantProfile: {
                        select: {
                            nid: true,
                            address: true,
                            occupation: true,
                        },
                    },
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
            stay: {
                select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    monthlyRent: true,
                },
            },
        },
    });

    if (!application) {
        throw new AppError(httpStatus.NOT_FOUND, "Application not found");
    }

    return application;
};

const assertApplicationAccess = async (
    userId: string,
    role: Role,
    applicationId: string,
) => {
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            advertisement: {
                include: {
                    flat: { select: { id: true, propertyId: true } },
                    room: { select: { id: true, flatId: true } },
                },
            },
            stay: true,
        },
    });
    if (application?.advertisement.category === "ROOMMATE") {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Owner/Manager cannot access this application",
        );
    }

    if (!application) {
        throw new AppError(httpStatus.NOT_FOUND, "Application not found");
    }

    const flatId =
        application.advertisement.flatId ??
        application.advertisement.room?.flatId;

    if (!flatId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Application is not linked to any flat",
        );
    }

    if (role === Role.OWNER) {
        const ownership = await prisma.propertyOwnership.findFirst({
            where: { flatId, ownerId: userId, status: "ACTIVE" },
        });

        if (!ownership && application.advertisement.createdById !== userId) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You do not have access to this application",
            );
        }
    } else {
        const assignment = await prisma.managerAssignment.findFirst({
            where: { flatId, managerId: userId, status: "ACTIVE" },
        });

        if (!assignment && application.advertisement.createdById !== userId) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You do not have access to this application",
            );
        }
    }

    return application;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const calculateBillingPeriod = (
    startDate: Date,
    endDate: Date,
    monthlyRent: number,
) => {
    const billingEnd = new Date(startDate);
    billingEnd.setDate(billingEnd.getDate() + 29);
    // billingEnd.setMonth(billingEnd.getMonth() + 1);

    const finalEnd = billingEnd > endDate ? endDate : billingEnd;

    const billedDays =
        Math.round((finalEnd.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;

    const amount = Number(
        ((monthlyRent / 30) * Math.max(billedDays, 1)).toFixed(2),
    );

    return {
        billingStart: startDate,
        billingEnd: finalEnd,
        amount,
    };
};

const updateApplication = async (
    userId: string,
    role: Role,
    applicationId: string,
    status: ApplicationStatus,
) => {
    if (role === Role.TENANT) {
        if (status !== ApplicationStatus.WITHDRAWN) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "Tenant can only withdraw applications",
            );
        }

        const application = await prisma.application.findFirst({
            where: { id: applicationId, applicantId: userId },
            include: { stay: true },
        });

        if (!application) {
            throw new AppError(httpStatus.NOT_FOUND, "Application not found");
        }

        if (application.status === ApplicationStatus.APPROVED) {
            if (
                !application.stay ||
                application.stay.status !== StayStatus.WAITING_FOR_PAYMENT
            ) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Approved applications can only be withdrawn when the stay is waiting for payment",
                );
            }
            // await prisma.invoice.deleteMany({
            //     where: { stayId: application.stay.id },
            // });

            // await prisma.stay.delete({
            //     where: { id: application.stay.id },
            // });

            await prisma.invoice.updateMany({
                where: {
                    stayId: application.stay.id,
                    status: BillStatus.PENDING,
                },
                data: { BillStatus: BillStatus.CANCELLED },
            });
            await prisma.stay.update({
                where: { id: application.stay.id },
                data: { status: StayStatus.CANCELLED },
            });
        } else if (application.status !== ApplicationStatus.PENDING) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Only pending or approved (waiting for payment) applications can be withdrawn",
            );
        }

        return prisma.application.update({
            where: { id: applicationId },
            data: { status: ApplicationStatus.WITHDRAWN },
            select: {
                id: true,
                type: true,
                status: true,
                requestedStartDate: true,
                requestedEndDate: true,
                note: true,
                updatedAt: true,
            },
        });
    }

    if (
        status != ApplicationStatus.APPROVED &&
        status != ApplicationStatus.REJECTED
    ) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Owner/manager can only approve or reject applications",
        );
    }

    const application = await assertApplicationAccess(
        userId,
        role,
        applicationId,
    );

    if (application.status !== ApplicationStatus.PENDING) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only pending applications can be reviewed",
        );
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.application.update({
            where: { id: applicationId },
            data: {
                status: status as any,
                reviewedById: userId,
                reviewedAt: new Date(),
            },
            select: {
                id: true,
                type: true,
                status: true,
                requestedStartDate: true,
                requestedEndDate: true,
                note: true,
                reviewedById: true,
                reviewedAt: true,
            },
        });

        if (status === ApplicationStatus.APPROVED && !application.stay) {
            const flatId =
                application.advertisement.flatId ??
                application.advertisement.room?.flatId;

            const flat = await tx.flat.findUnique({
                where: { id: flatId! },
                select: { propertyId: true },
            });

            if (!flat) {
                throw new AppError(httpStatus.NOT_FOUND, "Flat not found");
            }

            const monthlyRent = Number(application.advertisement.monthlyRent);

            const stay = await tx.stay.create({
                data: {
                    applicationId: application.id,
                    occupantId: application.applicantId,
                    propertyId: flat.propertyId,
                    flatId: flatId!,
                    roomId: application.advertisement.roomId || null,
                    type: StayType.PRIMARY,
                    status: StayStatus.WAITING_FOR_PAYMENT,
                    startDate: application.requestedStartDate,
                    endDate: application.requestedEndDate,
                    monthlyRent: application.advertisement.monthlyRent,
                },
            });

            const { billingStart, billingEnd, amount } = calculateBillingPeriod(
                application.requestedStartDate,
                application.requestedEndDate,
                monthlyRent,
            );

            const ownership = await prisma.propertyOwnership.findFirst({
                where: {
                    flatId,
                    status: "ACTIVE",
                },
            });

            await tx.invoice.create({
                data: {
                    stayId: stay.id,
                    payerId: application.applicantId,
                    receiverId:
                        ownership?.ownerId ||
                        application.advertisement.createdById,
                    type: InvoiceType.RENT,
                    amount: new Prisma.Decimal(amount),
                    billingPeriodStart: billingStart,
                    billingPeriodEnd: billingEnd,
                    // dueDate: billingEnd,
                    status: BillStatus.PENDING,
                    description: "First rent installment",
                },
            });
        }

        return updated;
    });
};

const getInvoices = async (
    userId: string,
    role: Role,
    query: IInvoiceQuery,
) => {
    const { status, page = 1, limit = 10 } = query;

    const where: Prisma.InvoiceWhereInput = {};

    applyInvoiceAccessScope(where, userId, role);

    if (status) {
        where.status = status;
    }

    const total = await prisma.invoice.count({ where });

    const invoices = await prisma.invoice.findMany({
        where,
        select: {
            id: true,
            stayId: true,
            payerId: true,
            receiverId: true,
            type: true,
            amount: true,
            billingPeriodStart: true,
            billingPeriodEnd: true,
            dueDate: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            receiver: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            stay: {
                select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    monthlyRent: true,
                    property: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    flat: {
                        select: {
                            id: true,
                            flatNumber: true,
                        },
                    },
                    room: {
                        select: {
                            id: true,
                            roomNumber: true,
                        },
                    },
                },
            },
            payments: {
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    transactionReference: true,
                    paidAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    return {
        invoices,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(Number(total) / Number(limit)),
        },
    };
};

const applyStayAccessScope = (
    where: Prisma.StayWhereInput,
    userId: string,
    role: Role,
) => {
    if (role === Role.TENANT) {
        where.occupantId = userId;
    } else if (role === Role.OWNER) {
        where.flat = {
            ownerships: {
                some: { ownerId: userId, status: "ACTIVE" },
            },
        };

        where.type = StayType.PRIMARY;
    } else {
        where.flat = {
            managerAssignments: {
                some: { managerId: userId, status: "ACTIVE" },
            },
        };
        where.type = StayType.PRIMARY;
    }
};

const getInvoicesByStay = async (
    userId: string,
    role: Role,
    query: IStayInvoiceQuery,
) => {
    const { applicationId, stayId, status } = query;

    const stayWhere: Prisma.StayWhereInput = {};

    if (stayId) {
        stayWhere.id = stayId;
    }

    if (applicationId) {
        stayWhere.applicationId = applicationId;
    }

    applyStayAccessScope(stayWhere, userId, role);

    const stay = await prisma.stay.findFirst({
        where: stayWhere,
        select: { id: true },
    });

    if (!stay) {
        throw new AppError(httpStatus.NOT_FOUND, "Stay not found");
    }

    const invoiceWhere: Prisma.InvoiceWhereInput = {
        stayId: stay.id,
    };

    if (status) {
        invoiceWhere.status = status;
    }

    const total = await prisma.invoice.count({ where: invoiceWhere });

    const invoices = await prisma.invoice.findMany({
        where: invoiceWhere,
        select: {
            id: true,
            stayId: true,
            payerId: true,
            receiverId: true,
            type: true,
            amount: true,
            billingPeriodStart: true,
            billingPeriodEnd: true,
            dueDate: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            receiver: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            stay: {
                select: {
                    id: true,
                    applicationId: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    monthlyRent: true,
                    property: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    flat: {
                        select: {
                            id: true,
                            flatNumber: true,
                        },
                    },
                    room: {
                        select: {
                            id: true,
                            roomNumber: true,
                        },
                    },
                },
            },
            payments: {
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    transactionReference: true,
                    paidAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return {
        invoices,
    };
};

const applyInvoiceAccessScope = (
    where: Prisma.InvoiceWhereInput,
    userId: string,
    role: Role,
) => {
    if (role === Role.TENANT) {
        where.payerId = userId;
    } else if (role === Role.OWNER) {
        where.stay = {
            flat: {
                ownerships: {
                    some: { ownerId: userId, status: "ACTIVE" },
                },
            },
        };
    } else {
        where.stay = {
            flat: {
                managerAssignments: {
                    some: { managerId: userId, status: "ACTIVE" },
                },
            },
        };
    }
};

const getInvoiceById = async (
    userId: string,
    role: Role,
    invoiceId: string,
) => {
    const where: Prisma.InvoiceWhereInput = {
        id: invoiceId,
    };

    applyInvoiceAccessScope(where, userId, role);

    const invoice = await prisma.invoice.findFirst({
        where,
        select: {
            id: true,
            stayId: true,
            payerId: true,
            receiverId: true,
            type: true,
            amount: true,
            billingPeriodStart: true,
            billingPeriodEnd: true,
            dueDate: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            receiver: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            stay: {
                select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    monthlyRent: true,
                    property: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    flat: {
                        select: {
                            id: true,
                            flatNumber: true,
                        },
                    },
                    room: {
                        select: {
                            id: true,
                            roomNumber: true,
                        },
                    },
                },
            },
            payments: {
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    transactionReference: true,
                    paidAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!invoice) {
        throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
    }

    return invoice;
};

const getStays = async (userId: string, role: Role) => {
    const where: Prisma.StayWhereInput = {};

    applyStayAccessScope(where, userId, role);

    const stays = await prisma.stay.findMany({
        where,
        select: {
            id: true,
            applicationId: true,
            occupantId: true,
            propertyId: true,
            flatId: true,
            roomId: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            createdAt: true,
            updatedAt: true,
            application: {
                select: {
                    id: true,
                    status: true,
                    requestedStartDate: true,
                    requestedEndDate: true,
                    advertisement: {
                        select: {
                            id: true,
                            title: true,
                            monthlyRent: true,
                        },
                    },
                },
            },
            occupant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            property: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                },
            },
            flat: {
                select: {
                    id: true,
                    flatNumber: true,
                    rooms: {
                        select: {
                            id: true,
                            roomNumber: true,
                            name: true,
                        },
                        orderBy: { roomNumber: "asc" },
                    },
                },
            },
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                    name: true,
                },
            },
            invoices: {
                select: {
                    id: true,
                    type: true,
                    amount: true,
                    billingPeriodStart: true,
                    billingPeriodEnd: true,
                    dueDate: true,
                    status: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const processedStays = stays.map((stay) => ({
        ...stay,
        flat: {
            id: stay.flat.id,
            flatNumber: stay.flat.flatNumber,
            rooms: stay.roomId
                ? stay.flat.rooms.filter((room) => room.id === stay.roomId)
                : stay.flat.rooms,
        },
    }));

    return {
        stays: processedStays,
    };
};

export const TenantService = {
    createViewingRequest,
    getViewingRequests,
    getViewingRequestById,
    updateViewingRequestStatus,
    updateViewingRequest,
    createApplication,
    getApplications,
    getApplicationById,
    updateApplication,
    getInvoices,
    getInvoicesByStay,
    getInvoiceById,
    getStays,
};
