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
    page?: number;
    limit?: number;
}