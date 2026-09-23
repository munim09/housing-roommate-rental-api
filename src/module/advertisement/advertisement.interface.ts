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
    details?: Record<string, unknown>;
}

export interface IUpdateAdvertisementStatus {
    status: "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";
    details?: Record<string, unknown>;
}