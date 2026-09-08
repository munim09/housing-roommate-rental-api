export interface ICreateAdvertisement {
    title: string;
    description?: string;
    monthlyRent: number;
    availableFrom: Date;
    availableTo: Date;
}