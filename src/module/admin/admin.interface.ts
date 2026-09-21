import { Role, UserStatus } from "../../../generated/prisma/enums";

export interface IAdminUserQuery {
    role?: Role;
    status?: UserStatus;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IAdminUpdateStatus {
    userId: string;
    status: UserStatus;
}

export interface IAdminUpdateRole {
    userId: string;
    role: Role;
}

export interface IAdminCreateCity {
    name: string;
}

export interface IAdminCreateArea {
    cityId: string;
    name: string;
}

export interface IAdminDashboardStats {
    users: number;
    properties: number;
    flats: number;
    activeAdvertisements: number;
    currentConfirmedStays: number;
    activeOwners: number;
    activeManagers: number;
}
