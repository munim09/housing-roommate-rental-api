import httpStatus from "http-status";
import { Prisma, UserStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
    IAdminCreateArea,
    IAdminCreateCity,
    IAdminDashboardStats,
    IAdminUserQuery,
} from "./admin.interface";

const getAllUsers = async (query: IAdminUserQuery) => {
    const {
        role,
        status,
        search,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = query;

    const where: Prisma.UserWhereInput = {};

    if (role) {
        where.role = role;
    }

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    return {
        users,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(Number(total) / Number(limit)),
        },
    };
};

const getAllUsersWithProfiles = async (query: IAdminUserQuery) => {
    const {
        role,
        status,
        search,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = query;

    const where: Prisma.UserWhereInput = {};

    if (role) {
        where.role = role;
    }

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            authProvider: true,
            createdAt: true,
            updatedAt: true,
            ownerProfile: true,
            managerProfile: true,
            tenantProfile: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    return {
        users,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(Number(total) / Number(limit)),
        },
    };
};

const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            ownerProfile: true,
            managerProfile: true,
            tenantProfile: true,
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role === "ADMIN") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Cannot change status of an admin user",
        );
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { status },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
        },
    });

    return updated;
};

const updateUserRole = async (userId: string, role: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role === "ADMIN") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Cannot change role of an admin user",
        );
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
        },
    });

    return updated;
};

const deleteUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role === "ADMIN") {
        throw new AppError(httpStatus.FORBIDDEN, "Cannot delete an admin user");
    }

    await prisma.user.delete({ where: { id: userId } });

    return { message: "User deleted successfully" };
};

const createCity = async (data: IAdminCreateCity) => {
    const city = await prisma.city.create({
        data: { name: data.name },
    });

    return city;
};

const createArea = async (data: IAdminCreateArea) => {
    const city = await prisma.city.findUnique({
        where: { id: data.cityId },
    });

    if (!city) {
        throw new AppError(httpStatus.NOT_FOUND, "City not found");
    }

    const area = await prisma.area.create({
        data: {
            name: data.name,
            cityId: data.cityId,
        },
        include: { city: true },
    });

    return area;
};

const getDashboardStats = async (): Promise<IAdminDashboardStats> => {
    const [users, properties, flats, activeAdvertisements, currentConfirmedStays, activeOwners, activeManagers] =
        await Promise.all([
            prisma.user.count(),
            prisma.property.count(),
            prisma.flat.count(),
            prisma.advertisement.count({
                where: { status: "PUBLISHED" },
            }),
            prisma.stay.count({
                where: { status: "CONFIRMED" },
            }),
            prisma.user.count({
                where: { role: "OWNER", status: "ACTIVE" },
            }),
            prisma.user.count({
                where: { role: "MANAGER", status: "ACTIVE" },
            }),
        ]);

    return {
        users,
        properties,
        flats,
        activeAdvertisements,
        currentConfirmedStays,
        activeOwners,
        activeManagers,
    };
};

export const AdminService = {
    getAllUsers,
    getAllUsersWithProfiles,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    createCity,
    createArea,
    getDashboardStats,
};
