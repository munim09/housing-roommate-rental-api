import { RentalType } from "../../../generated/prisma/client";

export interface IPublicCityQuery {
    search?: string;
    page?: number;
    limit?: number;
}

export interface IPublicAreaQuery {
    cityId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface IPublicAvailableAdvertisementQuery {
    areaId: string;
    from: string;
    to: string;
    rentalType?: RentalType;
    page?: number;
    limit?: number;
}