import httpStatus from "http-status";
import {
    AdvertisementStatus,
    ApplicationStatus,
    Prisma,
    RentalType,
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
    const { areaId, from, to, rentalType, page = 1, limit = 10 } = query;

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

    if (rentalType && !Object.values(RentalType).includes(rentalType)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid rentalType");
    }

    if (endDate <= startDate) {
        throw new AppError(httpStatus.BAD_REQUEST, "to must be after from");
    }

    const conflictingStayFilterPrimary: Prisma.StayWhereInput = {
        status: {
            in: [StayStatus.WAITING_FOR_PAYMENT, StayStatus.CONFIRMED],
        },
        rentalType: {
            in: [RentalType.PRIMARY_ENTIRE_FLAT, RentalType.PRIMARY_ROOM],
        },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
    };

    const wherePrimary: Prisma.AdvertisementWhereInput = {
        status: AdvertisementStatus.PUBLISHED,
        availableFrom: { lte: startDate },
        availableTo: { gte: endDate },
        rentalType: {
            in: [RentalType.PRIMARY_ENTIRE_FLAT, RentalType.PRIMARY_ROOM],
        },
        ...(rentalType ? { rentalType } : {}),
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
                        stays: { some: conflictingStayFilterPrimary },
                    },
                },
                {
                    room: {
                        OR: [
                            { stays: { some: conflictingStayFilterPrimary } },
                            {
                                flat: {
                                    stays: {
                                        some: {
                                            ...conflictingStayFilterPrimary,
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

    const conflictingStayFilterSecondary: Prisma.StayWhereInput = {
        status: {
            in: [StayStatus.WAITING_FOR_PAYMENT, StayStatus.CONFIRMED],
        },
        rentalType: {
            in: [RentalType.SECONDARY_ROOM, RentalType.SECONDARY_ROOM_SHARING],
        },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
    };

    const whereSecondary: Prisma.AdvertisementWhereInput = {
        status: AdvertisementStatus.PUBLISHED,
        availableFrom: { lte: startDate },
        availableTo: { gte: endDate },
        rentalType: {
            in: [RentalType.SECONDARY_ROOM, RentalType.SECONDARY_ROOM_SHARING],
        },
        ...(rentalType ? { rentalType } : {}),
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
                        stays: { some: conflictingStayFilterSecondary },
                    },
                },
                {
                    room: {
                        OR: [
                            { stays: { some: conflictingStayFilterSecondary } },
                            {
                                flat: {
                                    stays: {
                                        some: {
                                            ...conflictingStayFilterSecondary,
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

    const where: Prisma.AdvertisementWhereInput = {
        OR: [wherePrimary, whereSecondary],
    };

    const total = await prisma.advertisement.count({
        where: where,
    });

    const advertisements = await prisma.advertisement.findMany({
        where: where,
        select: {
            id: true,
            title: true,
            description: true,
            rentalType: true,
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

const getAvailableAdvertisements_auto = async (
    query: IPublicAvailableAdvertisementQuery,
) => {
    const { areaId, from, to, rentalType, page = 1, limit = 10 } = query;

    if (!areaId) {
        throw new AppError(httpStatus.BAD_REQUEST, "areaId is required");
    }

    if (rentalType && !Object.values(RentalType).includes(rentalType)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid rentalType");
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

    const conflictingApplicationFilter: Prisma.ApplicationWhereInput = {
        status: {
            in: [ApplicationStatus.PENDING, ApplicationStatus.APPROVED],
        },
        requestedStartDate: { lte: endDate },
        requestedEndDate: { gte: startDate },
    };

    const PRIMARY_RENTAL_TYPES: RentalType[] = [
        RentalType.PRIMARY_ENTIRE_FLAT,
        RentalType.PRIMARY_ROOM,
    ];
    const SECONDARY_RENTAL_TYPES: RentalType[] = [
        RentalType.SECONDARY_ROOM,
        RentalType.SECONDARY_ROOM_SHARING,
    ];

    const currentPage = Number(page);
    const currentLimit = Number(limit);

    if (!Number.isInteger(currentPage) || currentPage < 1) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "page must be a positive integer",
        );
    }
    if (!Number.isInteger(currentLimit) || currentLimit < 1) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "limit must be a positive integer",
        );
    }

    type ConflictStay = {
        flatId: string;
        roomId: string | null;
        occupantId: string;
    };

    type ConflictApplication = {
        advertisement: {
            flatId: string | null;
            roomId: string | null;
            createdById: string;
        };
    };

    const conflictingAdvertisementWhere = (
        rentalTypes: RentalType[],
    ): Prisma.AdvertisementWhereInput => ({
        status: AdvertisementStatus.PUBLISHED,
        availableFrom: { lte: startDate },
        availableTo: { gte: endDate },
        rentalType: { in: rentalTypes },
        ...(rentalType ? { rentalType } : {}),
        OR: [
            { flat: { property: { areaId } } },
            { room: { flat: { property: { areaId } } } },
        ],
    });

    const hasConflict = (
        stays: ConflictStay[],
        applications: ConflictApplication[],
        advertisement: {
            flatId: string | null;
            roomId: string | null;
            createdById: string;
        },
    ): boolean => {
        const hasStayConflict = stays.some((stay) => {
            if (stay.flatId !== advertisement.flatId) return false;
            if (stay.occupantId === advertisement.createdById) return false;
            if (advertisement.roomId) {
                return (
                    stay.roomId === advertisement.roomId || stay.roomId === null
                );
            }
            return true;
        });

        const hasApplicationConflict = applications.some((application) => {
            if (
                application.advertisement.createdById ===
                advertisement.createdById
            ) {
                return false;
            }
            if (advertisement.roomId) {
                return (
                    application.advertisement.roomId === advertisement.roomId ||
                    (application.advertisement.roomId === null &&
                        application.advertisement.flatId ===
                            advertisement.flatId)
                );
            }
            return application.advertisement.flatId === advertisement.flatId;
        });

        return hasStayConflict || hasApplicationConflict;
    };

    const retrieveAvailable = async (rentalTypes: RentalType[]) => {
        const candidates = await prisma.advertisement.findMany({
            where: conflictingAdvertisementWhere(rentalTypes),
            select: {
                id: true,
                flatId: true,
                roomId: true,
                createdById: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const flatIds = [
            ...new Set(candidates.map((ad) => ad.flatId).filter(Boolean)),
        ] as string[];
        const roomIds = [
            ...new Set(candidates.map((ad) => ad.roomId).filter(Boolean)),
        ] as string[];

        const [conflictingStays, conflictingApplications] = await Promise.all([
            flatIds.length > 0
                ? prisma.stay.findMany({
                      where: {
                          ...conflictingStayFilter,
                          rentalType: { in: rentalTypes },
                          flatId: { in: flatIds },
                      },
                      select: {
                          flatId: true,
                          roomId: true,
                          occupantId: true,
                      },
                  })
                : Promise.resolve([] as ConflictStay[]),
            flatIds.length > 0 || roomIds.length > 0
                ? prisma.application.findMany({
                      where: {
                          ...conflictingApplicationFilter,
                          rentalType: { in: rentalTypes },
                          advertisement: {
                              OR: [
                                  { flatId: { in: flatIds }, roomId: null },
                                  { roomId: { in: roomIds } },
                              ],
                          },
                      },
                      select: {
                          advertisement: {
                              select: {
                                  flatId: true,
                                  roomId: true,
                                  createdById: true,
                              },
                          },
                      },
                  })
                : Promise.resolve([] as ConflictApplication[]),
        ]);

        return candidates.filter(
            (advertisement) =>
                !hasConflict(
                    conflictingStays,
                    conflictingApplications,
                    advertisement,
                ),
        );
    };

    const searchPrimary =
        !rentalType || PRIMARY_RENTAL_TYPES.includes(rentalType);
    const searchSecondary =
        !rentalType || SECONDARY_RENTAL_TYPES.includes(rentalType);

    const [primaryAvailable, secondaryAvailable] = await Promise.all([
        searchPrimary ? retrieveAvailable(PRIMARY_RENTAL_TYPES) : [],
        searchSecondary ? retrieveAvailable(SECONDARY_RENTAL_TYPES) : [],
    ]);

    const availableAdvertisements = [
        ...primaryAvailable,
        ...secondaryAvailable,
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = availableAdvertisements.length;
    const startIndex = (currentPage - 1) * currentLimit;
    const pageAds = availableAdvertisements.slice(
        startIndex,
        startIndex + currentLimit,
    );

    const advertisements = await prisma.advertisement.findMany({
        where: {
            id: { in: pageAds.map((ad) => ad.id) },
        },
        select: {
            id: true,
            title: true,
            description: true,
            rentalType: true,
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
    });

    return {
        advertisements,
        meta: {
            page: currentPage,
            limit: currentLimit,
            total,
            totalPages: Math.ceil(total / currentLimit),
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

    if (advertisement.rentalType === RentalType.PRIMARY_ENTIRE_FLAT) {
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
