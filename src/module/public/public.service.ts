import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { IPublicAreaQuery, IPublicCityQuery } from "./public.interface";

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

export const PublicService = {
    getCities,
    getAreas,
};
