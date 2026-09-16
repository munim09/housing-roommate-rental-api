import { AdvertisementTarget } from "../../../generated/prisma/enums";

export interface ICreateRoommateAdvertisement {
    stayId: string;
    roomId: string;
    title: string;
    advertisementTarget: AdvertisementTarget;
    description?: string;
    monthlyRent: number;
    availableFrom: Date;
    availableTo: Date;
}
