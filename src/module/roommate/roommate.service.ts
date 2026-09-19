import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import {
    AdvertisementStatus,
    ApplicationStatus,
    BillStatus,
    InvoiceType,
    RentalType,
    RoomStatus,
    StayStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
    ICreateRoommateAdvertisement,
    ICreateUtilityBill,
    IUpdateRoommateAdvertisement,
    IUpdateUtilityBill,
} from "./roommate.interface";

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
        where: {
            id: stayId,
            occupantId: tenantId,
            rentalType: {
                in: [RentalType.PRIMARY_ENTIRE_FLAT, RentalType.PRIMARY_ROOM],
            },
        },
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
            roomId,
            rentalType: {
                in: [
                    RentalType.SECONDARY_ROOM,
                    RentalType.SECONDARY_ROOM_SHARING,
                ],
            },
            // category: AdvertisementCategory.SECONDARY_RENTAL,
            // OR: [
            //     { roomId },
            //     {
            //         flatId: room.flatId,
            //         target: AdvertisementTarget.ENTIRE_FLAT,
            //     },
            // ],
        },
        select: { id: true },
    });

    if (conflictingAd) {
        throw new AppError(
            httpStatus.CONFLICT,
            "This room or its flat is already advertised in the given time period",
        );
    }

    if (
        advertisementTarget !== RentalType.SECONDARY_ROOM &&
        advertisementTarget !== RentalType.SECONDARY_ROOM_SHARING
    ) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Advertisement target must be ROOM or ROOM_SHARING",
        );
    }

    return prisma.advertisement.create({
        data: {
            createdById: tenantId,
            flatId: room.flatId,
            createdByTenantStayId: stayId,
            roomId,
            rentalType: advertisementTarget,
            // category: AdvertisementCategory.SECONDARY_RENTAL,
            // target: advertisementTarget,
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

const updateRoommateAdvertisement = async (
    tenantId: string,
    advertisementId: string,
    payload: IUpdateRoommateAdvertisement,
) => {
    const advertisement = await prisma.advertisement.findUnique({
        where: { id: advertisementId },
        include: {
            room: true,
            stay: { select: { startDate: true, endDate: true } },
        },
    });

    if (!advertisement) {
        throw new AppError(httpStatus.NOT_FOUND, "Advertisement not found");
    }

    if (advertisement.createdById !== tenantId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only the advertisement creator can update this advertisement",
        );
    }

    if (
        advertisement.rentalType !== RentalType.SECONDARY_ROOM &&
        advertisement.rentalType !== RentalType.SECONDARY_ROOM_SHARING
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only roommate advertisements can be updated here",
        );
    }

    const effectiveFrom = payload.availableFrom ?? advertisement.availableFrom;
    const effectiveTo = payload.availableTo ?? advertisement.availableTo;

    if (!effectiveFrom || !effectiveTo) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement availability dates are not set",
        );
    }

    if (effectiveTo <= effectiveFrom) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Available to must be after available from",
        );
    }

    if (
        advertisement.stay &&
        (effectiveFrom < advertisement.stay.startDate ||
            effectiveTo > advertisement.stay.endDate)
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement availability must be within the stay period",
        );
    }

    if (advertisement.roomId) {
        const conflictingAd = await prisma.advertisement.findFirst({
            where: {
                id: { not: advertisementId },
                status: { in: AD_CONFLICT_STATUSES },
                availableFrom: { lte: effectiveTo },
                availableTo: { gte: effectiveFrom },
                roomId: advertisement.roomId,
                rentalType: {
                    in: [
                        RentalType.SECONDARY_ROOM,
                        RentalType.SECONDARY_ROOM_SHARING,
                    ],
                },
            },
            select: { id: true },
        });

        if (conflictingAd) {
            throw new AppError(
                httpStatus.CONFLICT,
                "This room is already advertised in the given time period",
            );
        }
    }

    return prisma.advertisement.update({
        where: { id: advertisementId },
        data: {
            title: payload?.title ?? advertisement.title,
            description: payload?.description ?? advertisement.description,
            monthlyRent: payload?.monthlyRent ?? advertisement.monthlyRent,
            rentalType:
                payload?.advertisementTarget ?? advertisement.rentalType,
            availableFrom:
                payload?.availableFrom ?? advertisement.availableFrom,
            availableTo: payload?.availableTo ?? advertisement.availableTo,
            status: payload?.status ?? advertisement.status,
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
            rentalType: {
                in: [
                    RentalType.SECONDARY_ROOM,
                    RentalType.SECONDARY_ROOM_SHARING,
                ],
            },
            application: {
                advertisement: {
                    createdById: tenantId,
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
            rentalType: true,
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
                            rentalType: true,
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
            advertisement: {
                rentalType: {
                    in: [
                        RentalType.SECONDARY_ROOM,
                        RentalType.SECONDARY_ROOM_SHARING,
                    ],
                },
                createdById: userId,
            },
        },
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
                    rentalType: true,
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

    if (
        application.rentalType !== RentalType.SECONDARY_ROOM &&
        application.rentalType !== RentalType.SECONDARY_ROOM_SHARING
    ) {
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
                rentalType: true,
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
                    rentalType: application.rentalType,
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

const getUtilityBillsForStay = async (tenantId: string, stayId: string) => {
    const stay = await prisma.stay.findUnique({
        where: { id: stayId },
        select: {
            rentalType: true,
            application: {
                select: {
                    advertisement: {
                        select: { createdById: true },
                    },
                },
            },
        },
    });

    if (!stay) {
        throw new AppError(httpStatus.NOT_FOUND, "Stay not found");
    }

    if (
        stay.rentalType !== RentalType.SECONDARY_ROOM &&
        stay.rentalType !== RentalType.SECONDARY_ROOM_SHARING
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Utility bills only exist for roommate stays",
        );
    }

    if (stay.application.advertisement.createdById !== tenantId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only the advertise tenant can view utility bills for this stay",
        );
    }

    const bills = await prisma.invoice.findMany({
        where: { stayId, type: InvoiceType.UTILITY },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            type: true,
            amount: true,
            billingPeriodStart: true,
            billingPeriodEnd: true,
            dueDate: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            payer: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } },
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

    return {
        bills,
    };
};

const createUtilityBill = async (
    tenantId: string,
    stayId: string,
    payload: ICreateUtilityBill,
) => {
    const { amount, billingPeriodStart, billingPeriodEnd, description } =
        payload;

    const stay = await prisma.stay.findUnique({
        where: { id: stayId },
        select: {
            status: true,
            rentalType: true,
            occupantId: true,
            application: {
                select: {
                    advertisement: {
                        select: { createdById: true },
                    },
                },
            },
        },
    });

    if (!stay) {
        throw new AppError(httpStatus.NOT_FOUND, "Stay not found");
    }

    if (
        stay.rentalType !== RentalType.SECONDARY_ROOM &&
        stay.rentalType !== RentalType.SECONDARY_ROOM_SHARING
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Utility bills can only be created for roommate stays",
        );
    }

    if (stay.application.advertisement.createdById !== tenantId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only the advertise tenant can create utility bills for this stay",
        );
    }

    if (stay.status !== StayStatus.CONFIRMED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Can only create utility bills for confirmed stays",
        );
    }

    if (billingPeriodStart >= billingPeriodEnd) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Billing period start must be before end",
        );
    }

    return prisma.invoice.create({
        data: {
            stayId,
            payerId: stay.occupantId,
            receiverId: tenantId,
            type: InvoiceType.UTILITY,
            amount: new Prisma.Decimal(amount),
            billingPeriodStart,
            billingPeriodEnd,
            status: BillStatus.PENDING,
            description: description || null,
        },
        select: {
            id: true,
            type: true,
            amount: true,
            billingPeriodStart: true,
            billingPeriodEnd: true,
            dueDate: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            stay: {
                select: {
                    id: true,
                    room: {
                        select: { id: true, roomNumber: true, name: true },
                    },
                    flat: { select: { id: true, flatNumber: true } },
                },
            },
            payer: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } },
        },
    });
};

const updateUtilityBill = async (
    tenantId: string,
    billId: string,
    payload: IUpdateUtilityBill,
) => {
    const {
        amount,
        billingPeriodStart,
        billingPeriodEnd,
        description,
        status,
    } = payload;

    const invoice = await prisma.invoice.findUnique({
        where: { id: billId },
        include: {
            stay: {
                select: {
                    id: true,
                    rentalType: true,
                    application: {
                        select: {
                            advertisement: {
                                select: { createdById: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!invoice) {
        throw new AppError(httpStatus.NOT_FOUND, "Utility bill not found");
    }

    if (invoice.type !== InvoiceType.UTILITY) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only utility bills can be updated here",
        );
    }

    if (
        invoice.stay.rentalType !== RentalType.SECONDARY_ROOM &&
        invoice.stay.rentalType !== RentalType.SECONDARY_ROOM_SHARING
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Utility bills only exist for roommate stays",
        );
    }

    if (invoice.stay.application.advertisement.createdById !== tenantId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only the advertise tenant can update this utility bill",
        );
    }

    if (invoice.status === BillStatus.PAID) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Paid utility bills cannot be updated",
        );
    }

    const effectiveStart = billingPeriodStart ?? invoice.billingPeriodStart;
    const effectiveEnd = billingPeriodEnd ?? invoice.billingPeriodEnd;

    if (effectiveStart >= effectiveEnd) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Billing period start must be before end",
        );
    }

    return prisma.invoice.update({
        where: { id: billId },
        data: {
            amount: amount ?? invoice.amount,
            billingPeriodStart: effectiveStart,
            billingPeriodEnd: effectiveEnd,
            description: description ?? invoice.description,
            status: status ?? invoice.status,
        },
        select: {
            id: true,
            type: true,
            amount: true,
            billingPeriodStart: true,
            billingPeriodEnd: true,
            dueDate: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            payer: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } },
        },
    });
};

export const RoommateService = {
    createRoommateAdvertisement,
    updateRoommateAdvertisement,
    getRoommateStays,
    getApplications,
    updateApplicationStatus,
    createUtilityBill,
    updateUtilityBill,
    getUtilityBillsForStay,
};
