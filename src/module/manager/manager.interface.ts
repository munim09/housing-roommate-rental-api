import { ApplicationStatus } from "../../../generated/prisma/enums";

export interface IManagerApplicationQuery {
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
}

export interface ICreateUtilityInvoice {
    stayId: string;
    amount: number;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    description?: string;
}

export interface IUpdateUtilityInvoice {
    amount?: number;
    billingPeriodStart?: Date;
    billingPeriodEnd?: Date;
    description?: string;
    status?: "PENDING" | "PAID" | "CANCELLED";
}