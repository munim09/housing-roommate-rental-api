import httpStatus from "http-status";
import {
    AdvertisementStatus,
    AdvertisementTarget,
    ApplicationStatus,
    Prisma,
    StayStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
    IPublicAreaQuery,
    IPublicAvailableAdvertisementQuery,
    IPublicCityQuery,
} from "./public.interface";

const getCities = async (query: IPublicCityQuery) => {
    const { search, page = 1, limit = 10 } = query;

    const where: Prisma.CityWhereInput = {};

    if (search) {
        where.name = { contains: search, mode: "insensitive" };
    }

    const total = await prisma.city.count({ where });

    const cities = await prisma.city.findMany({
        where,
        select: {
            id: true,
            name: true,
            createdAt: true,
            areas: {
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                },
                orderBy: {
                    name: "asc",
                },
            },
        },
        orderBy: { name: "asc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    return {
        cities,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

const getAreas = async (query: IPublicAreaQuery) => {
    const { cityId, search, page = 1, limit = 10 } = query;

    const where: Prisma.AreaWhereInput = {};

    if (cityId) {
        where.cityId = cityId;
    }

    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                city: {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            },
        ];
    }

    const total = await prisma.area.count({ where });

    const areas = await prisma.area.findMany({
        where,
        select: {
            id: true,
            name: true,
            cityId: true,
            city: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    properties: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    return {
        areas,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

const getAvailableAdvertisements = async (
    query: IPublicAvailableAdvertisementQuery,
) => {
    const { areaId, from, to, page = 1, limit = 10 } = query;

    if (!areaId) {
        throw new AppError(httpStatus.BAD_REQUEST, "areaId is required");
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "from and to must be valid dates",
        );
    }

    if (endDate <= startDate) {
        throw new AppError(httpStatus.BAD_REQUEST, "to must be after from");
    }

    const conflictingStayFilter: Prisma.StayWhereInput = {
        status: {
            in: [StayStatus.WAITING_FOR_PAYMENT, StayStatus.CONFIRMED],
        },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
    };

    const where: Prisma.AdvertisementWhereInput = {
        status: AdvertisementStatus.PUBLISHED,
        availableFrom: { lte: startDate },
        availableTo: { gte: endDate },
        OR: [
            { flat: { property: { areaId } } },
            { room: { flat: { property: { areaId } } } },
        ],
        applications: {
            none: {
                status: {
                    in: [ApplicationStatus.PENDING, ApplicationStatus.APPROVED],
                },
                requestedStartDate: { lte: endDate },
                requestedEndDate: { gte: startDate },
            },
        },
        NOT: {
            OR: [
                {
                    flat: {
                        stays: { some: conflictingStayFilter },
                    },
                },
                {
                    room: {
                        OR: [
                            { stays: { some: conflictingStayFilter } },
                            {
                                flat: {
                                    stays: {
                                        some: {
                                            ...conflictingStayFilter,
                                            roomId: null,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };

    const total = await prisma.advertisement.count({ where });

    const advertisements = await prisma.advertisement.findMany({
        where,
        select: {
            id: true,
            title: true,
            description: true,
            category: true,
            target: true,
            monthlyRent: true,
            availableFrom: true,
            availableTo: true,
            status: true,
            publishedAt: true,
            createdAt: true,
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
                    floorNumber: true,
                    bedrooms: true,
                    bathrooms: true,
                    areaSqFt: true,
                    status: true,
                    images: {
                        select: {
                            id: true,
                            imageUrl: true,
                            isPrimary: true,
                            sortOrder: true,
                        },
                        orderBy: { sortOrder: "asc" },
                    },
                    property: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            postalCode: true,
                            type: true,
                            area: {
                                select: {
                                    id: true,
                                    name: true,
                                    cityId: true,
                                    city: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                    name: true,
                    areaSqFt: true,
                    status: true,
                    images: {
                        select: {
                            id: true,
                            imageUrl: true,
                            isPrimary: true,
                            sortOrder: true,
                        },
                        orderBy: { sortOrder: "asc" },
                    },
                    flat: {
                        select: {
                            id: true,
                            flatNumber: true,
                            floorNumber: true,
                            areaSqFt: true,
                            status: true,
                            property: {
                                select: {
                                    id: true,
                                    name: true,
                                    address: true,
                                    postalCode: true,
                                    type: true,
                                    area: {
                                        select: {
                                            id: true,
                                            name: true,
                                            cityId: true,
                                            city: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    return {
        advertisements,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

const getAdvertisementById = async (advertisementId: string) => {
    const advertisement = await prisma.advertisement.findFirst({
        where: {
            id: advertisementId,
            status: AdvertisementStatus.PUBLISHED,
        },
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            flat: {
                include: {
                    images: {
                        select: {
                            id: true,
                            imageUrl: true,
                            isPrimary: true,
                            sortOrder: true,
                        },
                        orderBy: { sortOrder: "asc" },
                    },
                    property: {
                        include: {
                            area: {
                                select: {
                                    id: true,
                                    name: true,
                                    cityId: true,
                                    city: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    rooms: {
                        include: {
                            images: {
                                select: {
                                    id: true,
                                    imageUrl: true,
                                    isPrimary: true,
                                    sortOrder: true,
                                },
                                orderBy: { sortOrder: "asc" },
                            },
                        },
                        orderBy: { roomNumber: "asc" },
                    },
                },
            },
            room: {
                include: {
                    images: {
                        select: {
                            id: true,
                            imageUrl: true,
                            isPrimary: true,
                            sortOrder: true,
                        },
                        orderBy: { sortOrder: "asc" },
                    },
                    flat: {
                        include: {
                            images: {
                                select: {
                                    id: true,
                                    imageUrl: true,
                                    isPrimary: true,
                                    sortOrder: true,
                                },
                                orderBy: { sortOrder: "asc" },
                            },
                            property: {
                                include: {
                                    area: {
                                        select: {
                                            id: true,
                                            name: true,
                                            cityId: true,
                                            city: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!advertisement) {
        throw new AppError(httpStatus.NOT_FOUND, "Advertisement not found");
    }

    if (advertisement.target === AdvertisementTarget.ENTIRE_FLAT) {
        return {
            ...advertisement,
            flat: advertisement.flat ?? null,
            room: null,
        };
    }

    return {
        ...advertisement,
        flat: advertisement.room?.flat ?? null,
        room: advertisement.room ?? null,
    };
};

export const PublicService = {
    getCities,
    getAreas,
    getAvailableAdvertisements,
    getAdvertisementById,
};
