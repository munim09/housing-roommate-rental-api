import httpStatus from "http-status";
import {
    AdvertisementCategory,
    AdvertisementStatus,
    AdvertisementTarget,
    StayStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateAdvertisement } from "./advertisement.interface";

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
    StayStatus.ACTIVE,
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
    if (role === "OWNER") {
        const ownership = await prisma.propertyOwnership.findFirst({
            where: { flatId, ownerId: userId, status: "ACTIVE" },
        });

        if (!ownership) {
            throw new AppError(httpStatus.FORBIDDEN, "You do not own this flat");
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

    if (flat.status !== "ACTIVE") {
        throw new AppError(httpStatus.BAD_REQUEST, "Flat is not active");
    }

    await assertAdvertiserPermission(creatorId, role, flatId);
    validateAvailability(payload);

    const { availableFrom, availableTo } = payload;

    const flatAdvertisement = await prisma.advertisement.findFirst({
        where: {
            flatId,
            category: AdvertisementCategory.RENTAL,
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

    const roomAdvertisement = await prisma.advertisement.findFirst({
        where: {
            flatId,
            target: AdvertisementTarget.ROOM,
            category: AdvertisementCategory.RENTAL,
            status: { in: AD_CONFLICT_STATUSES },
            availableFrom: { lte: availableTo },
            availableTo: { gte: availableFrom },
        },
        select: { id: true },
    });

    if (roomAdvertisement) {
        throw new AppError(
            httpStatus.CONFLICT,
            "A room of this flat is already advertised in the given time period",
        );
    }

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
            category: AdvertisementCategory.RENTAL,
            target: AdvertisementTarget.ENTIRE_FLAT,
            title: payload.title,
            description: payload.description || null,
            monthlyRent: payload.monthlyRent,
            availableFrom,
            availableTo,
            status: AdvertisementStatus.PUBLISHED,
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

    if (room.status !== "ACTIVE") {
        throw new AppError(httpStatus.BAD_REQUEST, "Room is not active");
    }

    const flat = await prisma.flat.findUnique({ where: { id: room.flatId } });

    if (!flat || flat.status !== "ACTIVE") {
        throw new AppError(httpStatus.BAD_REQUEST, "Flat is not active");
    }

    await assertAdvertiserPermission(creatorId, role, room.flatId);
    validateAvailability(payload);

    const { availableFrom, availableTo } = payload;

    const roomAdvertisement = await prisma.advertisement.findFirst({
        where: {
            roomId,
            category: AdvertisementCategory.RENTAL,
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
            target: AdvertisementTarget.ENTIRE_FLAT,
            category: AdvertisementCategory.RENTAL,
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
            category: AdvertisementCategory.RENTAL,
            target: AdvertisementTarget.ROOM,
            title: payload.title,
            description: payload.description || null,
            monthlyRent: payload.monthlyRent,
            availableFrom,
            availableTo,
            status: AdvertisementStatus.PUBLISHED,
            publishedAt: new Date(),
        },
    });
};

export const AdvertisementService = {
    createFlatAdvertisement,
    createRoomAdvertisement,
};