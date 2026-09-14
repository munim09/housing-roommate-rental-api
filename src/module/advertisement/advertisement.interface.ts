export interface ICreateAdvertisement {
    title: string;
    description?: string;
    monthlyRent: number;
    availableFrom: Date;
    availableTo: Date;
}

export interface IUpdateAdvertisement {
    title?: string;
    description?: string | null;
    monthlyRent?: number;
    availableFrom?: Date;
    availableTo?: Date;
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