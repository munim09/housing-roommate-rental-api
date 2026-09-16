import httpStatus from "http-status";
import {
    AdvertisementCategory,
    AdvertisementStatus,
    AdvertisementTarget,
    ApplicationStatus,
    BillStatus,
    InvoiceType,
    RoomStatus,
    StayStatus,
    StayType,
} from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateRoommateAdvertisement } from "./roommate.interface";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const calculateBillingPeriod = (
    startDate: Date,
    endDate: Date,
    monthlyRent: number,
) => {
    const billingEnd = new Date(startDate);
    billingEnd.setDate(billingEnd.getDate() + 29);

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

const AD_CONFLICT_STATUSES: AdvertisementStatus[] = [
    AdvertisementStatus.DRAFT,
    AdvertisementStatus.PUBLISHED,
    AdvertisementStatus.UNPUBLISHED,
    AdvertisementStatus.RENTED,
    AdvertisementStatus.FULL,
];

const createRoommateAdvertisement = async (
    tenantId: string,
    payload: ICreateRoommateAdvertisement,
) => {
    const {
        stayId,
        roomId,
        title,
        advertisementTarget,
        description,
        monthlyRent,
        availableFrom,
        availableTo,
    } = payload;

    const stay = await prisma.stay.findFirst({
        where: { id: stayId, occupantId: tenantId },
    });

    if (!stay) {
        throw new AppError(httpStatus.NOT_FOUND, "Stay not found");
    }

    if (stay.status !== StayStatus.CONFIRMED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Can only create an advertisement for a confirmed stay",
        );
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room || room.flatId !== stay.flatId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Room does not belong to the stay",
        );
    }

    if (room.status !== RoomStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Room is not active");
    }

    if (
        availableFrom < stay.startDate ||
        availableTo > stay.endDate ||
        availableTo <= availableFrom
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement availability must be within the stay period",
        );
    }

    const conflictingAd = await prisma.advertisement.findFirst({
        where: {
            status: { in: AD_CONFLICT_STATUSES },
            availableFrom: { lte: availableTo },
            availableTo: { gte: availableFrom },
            OR: [
                { roomId },
                {
                    flatId: room.flatId,
                    target: AdvertisementTarget.ENTIRE_FLAT,
                },
            ],
        },
        select: { id: true },
    });

    if (conflictingAd) {
        throw new AppError(
            httpStatus.CONFLICT,
            "This room or its flat is already advertised in the given time period",
        );
    }

    return prisma.advertisement.create({
        data: {
            createdById: tenantId,
            flatId: room.flatId,
            createdByTenantStayId: stayId,
            roomId,
            category: AdvertisementCategory.ROOMMATE,
            target: advertisementTarget,
            title,
            description: description || null,
            monthlyRent,
            availableFrom,
            availableTo,
            status: AdvertisementStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        include: {
            flat: { select: { id: true, flatNumber: true } },
            room: { select: { id: true, roomNumber: true, name: true } },
        },
    });
};

const getRoommateStays = async (tenantId: string) => {
    const stays = await prisma.stay.findMany({
        where: {
            type: StayType.ROOMMATE,
            application: {
                advertisement: {
                    createdById: tenantId,
                    category: AdvertisementCategory.ROOMMATE,
                },
            },
        },
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
            occupant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            application: {
                select: {
                    id: true,
                    status: true,
                    requestedStartDate: true,
                    requestedEndDate: true,
                    note: true,
                    advertisement: {
                        select: {
                            id: true,
                            title: true,
                            monthlyRent: true,
                            target: true,
                            status: true,
                        },
                    },
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

const getApplications = async (userId: string) => {
    const applications = await prisma.application.findMany({
        where: {
            OR: [
                {
                    advertisement: {
                        category: AdvertisementCategory.ROOMMATE,
                        createdById: userId,
                    },
                },
                {
                    applicantId: userId,
                },
            ],
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
                    category: true,
                    target: true,
                    monthlyRent: true,
                    status: true,
                    availableFrom: true,
                    availableTo: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
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
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return {
        applications,
    };
};

const updateApplicationStatus = async (
    userId: string,
    applicationId: string,
    status: ApplicationStatus,
) => {
    if (
        status !== ApplicationStatus.APPROVED &&
        status !== ApplicationStatus.REJECTED
    ) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only approved or rejected status is allowed",
        );
    }

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            stay: true,
            advertisement: {
                select: {
                    category: true,
                    createdById: true,
                    flatId: true,
                    roomId: true,
                    monthlyRent: true,
                    room: { select: { flatId: true } },
                },
            },
        },
    });

    if (!application) {
        throw new AppError(httpStatus.NOT_FOUND, "Application not found");
    }

    if (application.advertisement.category !== AdvertisementCategory.ROOMMATE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only roommate applications can be reviewed here",
        );
    }

    if (application.advertisement.createdById !== userId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only the advertisement creator can update this application",
        );
    }

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
                status,
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
                createdAt: true,
                updatedAt: true,
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
                    type: StayType.ROOMMATE,
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

            await tx.invoice.create({
                data: {
                    stayId: stay.id,
                    payerId: application.applicantId,
                    receiverId: application.advertisement.createdById,
                    type: InvoiceType.RENT,
                    amount: new Prisma.Decimal(amount),
                    billingPeriodStart: billingStart,
                    billingPeriodEnd: billingEnd,
                    status: BillStatus.PENDING,
                    description: "First rent installment",
                },
            });
        }

        return updated;
    });
};

export const RoommateService = {
    createRoommateAdvertisement,
    getRoommateStays,
    getApplications,
    updateApplicationStatus,
};
