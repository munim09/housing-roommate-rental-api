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

export interface IManagerMaintenanceRequestQuery {
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    stayId?: string;
    page?: number;
    limit?: number;
}

export interface IUpdateMaintenanceRequest {
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED";
    scheduledFor?: Date;
    resolvedAt?: Date;
}