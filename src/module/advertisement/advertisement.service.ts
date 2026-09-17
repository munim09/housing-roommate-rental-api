import httpStatus from "http-status";
import {
    AdvertisementStatus,
    BillStatus,
    FlatStatus,
    InvoiceType,
    ManagerAssignmentStatus,
    RentalType,
    Role,
    RoomStatus,
    StayStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
    ICreateAdvertisement,
    ICreateUtilityInvoice,
    IUpdateAdvertisement,
    IUpdateUtilityInvoice,
} from "./advertisement.interface";

const AD_CONFLICT_STATUSES = [
    AdvertisementStatus.DRAFT,
    AdvertisementStatus.PUBLISHED,
    AdvertisementStatus.UNPUBLISHED,
    AdvertisementStatus.RENTED,
    AdvertisementStatus.FULL,
];

const STAY_CONFLICT_STATUSES = [
    StayStatus.WAITING_FOR_PAYMENT,
    StayStatus.CONFIRMED,
];

const startOfToday = (): Date => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};

const assertAdvertiserPermission = async (
    userId: string,
    role: string,
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
        return;
    }

    const assignment = await prisma.managerAssignment.findFirst({
        where: { flatId, managerId: userId, status: "ACTIVE" },
    });

    if (!assignment) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not managing this flat",
        );
    }
};

const validateAvailability = (payload: ICreateAdvertisement) => {
    if (payload.availableFrom < startOfToday()) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "availableFrom cannot be in the past",
        );
    }

    if (payload.availableTo <= payload.availableFrom) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "availableTo must be after availableFrom",
        );
    }
};

const createFlatAdvertisement = async (
    creatorId: string,
    role: string,
    flatId: string,
    payload: ICreateAdvertisement,
) => {
    const flat = await prisma.flat.findUnique({ where: { id: flatId } });

    if (!flat) {
        throw new AppError(httpStatus.NOT_FOUND, "Flat not found");
    }

    if (flat.status !== FlatStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Flat is not active");
    }

    await assertAdvertiserPermission(creatorId, role, flatId);
    validateAvailability(payload);

    const { availableFrom, availableTo } = payload;

    const flatAdvertisement = await prisma.advertisement.findFirst({
        where: {
            flatId,
            status: { in: AD_CONFLICT_STATUSES },
            availableFrom: { lte: availableTo },
            availableTo: { gte: availableFrom },
        },
        select: { id: true },
    });

    if (flatAdvertisement) {
        throw new AppError(
            httpStatus.CONFLICT,
            "This flat is already advertised in the given time period",
        );
    }

    // const roomAdvertisement = await prisma.advertisement.findFirst({
    //     where: {
    //         flatId,
    //         target: AdvertisementTarget.ROOM,
    //         category: AdvertisementCategory.RENTAL,
    //         status: { in: AD_CONFLICT_STATUSES },
    //         availableFrom: { lte: availableTo },
    //         availableTo: { gte: availableFrom },
    //     },
    //     select: { id: true },
    // });

    // if (roomAdvertisement) {
    //     throw new AppError(
    //         httpStatus.CONFLICT,
    //         "A room of this flat is already advertised in the given time period",
    //     );
    // }

    const stay = await prisma.stay.findFirst({
        where: {
            flatId,
            status: { in: STAY_CONFLICT_STATUSES },
            startDate: { lte: availableTo },
            endDate: { gte: availableFrom },
        },
        select: { id: true },
    });

    if (stay) {
        throw new AppError(
            httpStatus.CONFLICT,
            "This flat has an active booking in the given time period",
        );
    }

    return prisma.advertisement.create({
        data: {
            createdById: creatorId,
            flatId,
            rentalType: RentalType.PRIMARY_ENTIRE_FLAT,
            title: payload.title,
            description: payload.description || null,
            monthlyRent: payload.monthlyRent,
            availableFrom,
            availableTo,
            status: AdvertisementStatus.DRAFT,
            publishedAt: new Date(),
        },
    });
};

const createRoomAdvertisement = async (
    creatorId: string,
    role: string,
    roomId: string,
    payload: ICreateAdvertisement,
) => {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
        throw new AppError(httpStatus.NOT_FOUND, "Room not found");
    }

    if (room.status !== RoomStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Room is not active");
    }

    const flat = await prisma.flat.findUnique({ where: { id: room.flatId } });

    if (!flat || flat.status !== FlatStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Flat is not active");
    }

    await assertAdvertiserPermission(creatorId, role, room.flatId);
    validateAvailability(payload);

    const { availableFrom, availableTo } = payload;

    const roomAdvertisement = await prisma.advertisement.findFirst({
        where: {
            roomId,
            rentalType: RentalType.PRIMARY_ROOM,
            status: { in: AD_CONFLICT_STATUSES },
            availableFrom: { lte: availableTo },
            availableTo: { gte: availableFrom },
        },
        select: { id: true },
    });

    if (roomAdvertisement) {
        throw new AppError(
            httpStatus.CONFLICT,
            "This room is already advertised in the given time period",
        );
    }

    const flatAdvertisement = await prisma.advertisement.findFirst({
        where: {
            flatId: room.flatId,
            rentalType: RentalType.PRIMARY_ENTIRE_FLAT,
            status: { in: AD_CONFLICT_STATUSES },
            availableFrom: { lte: availableTo },
            availableTo: { gte: availableFrom },
        },
        select: { id: true },
    });

    if (flatAdvertisement) {
        throw new AppError(
            httpStatus.CONFLICT,
            "The whole flat is already advertised in the given time period",
        );
    }

    const stay = await prisma.stay.findFirst({
        where: {
            status: { in: STAY_CONFLICT_STATUSES },
            OR: [
                {
                    flatId: room.flatId,
                    roomId: null,
                    startDate: { lte: availableTo },
                    endDate: { gte: availableFrom },
                },
                {
                    roomId,
                    startDate: { lte: availableTo },
                    endDate: { gte: availableFrom },
                },
            ],
        },
        select: { id: true },
    });

    if (stay) {
        throw new AppError(
            httpStatus.CONFLICT,
            "This room or its flat has an active booking in the given time period",
        );
    }

    return prisma.advertisement.create({
        data: {
            createdById: creatorId,
            flatId: room.flatId,
            roomId,
            rentalType: RentalType.PRIMARY_ROOM,
            title: payload.title,
            description: payload.description || null,
            monthlyRent: payload.monthlyRent,
            availableFrom,
            availableTo,
            status: AdvertisementStatus.DRAFT,
            publishedAt: new Date(),
        },
    });
};

const CLOSED_ADVERTISEMENT_STATUSES: AdvertisementStatus[] = [
    AdvertisementStatus.RENTED,
    AdvertisementStatus.FULL,
    AdvertisementStatus.EXPIRED,
    AdvertisementStatus.ARCHIVED,
];

const ADVERTISER_STATUSES: AdvertisementStatus[] = [
    AdvertisementStatus.PUBLISHED,
    AdvertisementStatus.UNPUBLISHED,
    AdvertisementStatus.ARCHIVED,
];

const fetchAdvertisementWithFlat = (advertisementId: string) => {
    return prisma.advertisement.findUnique({
        where: { id: advertisementId },
        include: { room: { select: { flatId: true } } },
    });
};

const getAdvertisementFlatId = (
    advertisement: NonNullable<
        Awaited<ReturnType<typeof fetchAdvertisementWithFlat>>
    >,
) => advertisement.flatId ?? advertisement.room?.flatId;

const updateAdvertisementStatus = async (
    userId: string,
    role: string,
    advertisementId: string,
    status: AdvertisementStatus,
) => {
    const advertisement = await fetchAdvertisementWithFlat(advertisementId);

    if (!advertisement) {
        throw new AppError(httpStatus.NOT_FOUND, "Advertisement not found");
    }

    const flatId = getAdvertisementFlatId(advertisement);

    if (!flatId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement is not linked to any flat",
        );
    }

    await assertAdvertiserPermission(userId, role, flatId);

    // if (CLOSED_ADVERTISEMENT_STATUSES.includes(advertisement.status)) {
    //     throw new AppError(
    //         httpStatus.BAD_REQUEST,
    //         "Cannot update status of a closed advertisement",
    //     );
    // }

    if (!ADVERTISER_STATUSES.includes(status)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot set advertisement status to ${status}`,
        );
    }

    if (status === AdvertisementStatus.PUBLISHED) {
        if (!advertisement.availableFrom || !advertisement.availableTo) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Advertisement availability dates are not set",
            );
        }

        if (
            advertisement.availableFrom < startOfToday() ||
            advertisement.availableTo < startOfToday()
        ) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Advertisement availability dates must be today or in the future",
            );
        }
    }

    return prisma.advertisement.update({
        where: { id: advertisementId },
        data: {
            status,
            publishedAt:
                status === AdvertisementStatus.PUBLISHED
                    ? new Date()
                    : advertisement.publishedAt,
        },
    });
};

const updateAdvertisement = async (
    userId: string,
    role: string,
    advertisementId: string,
    payload: IUpdateAdvertisement,
) => {
    const advertisement = await fetchAdvertisementWithFlat(advertisementId);

    if (!advertisement) {
        throw new AppError(httpStatus.NOT_FOUND, "Advertisement not found");
    }

    const flatId = getAdvertisementFlatId(advertisement);

    if (!flatId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Advertisement is not linked to any flat",
        );
    }

    await assertAdvertiserPermission(userId, role, flatId);

    // if (CLOSED_ADVERTISEMENT_STATUSES.includes(advertisement.status)) {
    //     throw new AppError(
    //         httpStatus.BAD_REQUEST,
    //         "Cannot update details of a closed advertisement",
    //     );
    // }

    if (
        payload.availableFrom !== undefined ||
        payload.availableTo !== undefined
    ) {
        validateAvailability({
            title: advertisement.title,
            monthlyRent: Number(advertisement.monthlyRent),
            availableFrom:
                payload.availableFrom ?? advertisement.availableFrom!,
            availableTo: payload.availableTo ?? advertisement.availableTo!,
        });
    }

    return prisma.advertisement.update({
        where: { id: advertisementId },
        data: {
            title: payload.title,
            description: payload.description,
            monthlyRent: payload.monthlyRent,
            availableFrom: payload.availableFrom,
            availableTo: payload.availableTo,
        },
    });
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

export const AdvertisementService = {
    createFlatAdvertisement,
    createRoomAdvertisement,
    updateAdvertisementStatus,
    updateAdvertisement,
    createUtilityInvoice,
    updateUtilityInvoice,
};
