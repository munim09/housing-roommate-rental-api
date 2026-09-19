import {
    AdvertisementStatus,
    RentalType,
} from "../../../generated/prisma/enums";

export interface ICreateRoommateAdvertisement {
    stayId: string;
    roomId: string;
    title: string;
    advertisementTarget: RentalType;
    description?: string;
    monthlyRent: number;
    availableFrom: Date;
    availableTo: Date;
}

export interface IUpdateRoommateAdvertisement {
    title?: string;
    description?: string | null;
    advertisementTarget?: RentalType;
    monthlyRent?: number;
    availableFrom?: Date;
    availableTo?: Date;
    status?: AdvertisementStatus;
}

export interface ICreateUtilityBill {
    amount: number;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    description?: string;
}

export interface IUpdateUtilityBill {
    amount?: number;
    billingPeriodStart?: Date;
    billingPeriodEnd?: Date;
    description?: string;
    status?: "PENDING" | "CANCELLED";
}
