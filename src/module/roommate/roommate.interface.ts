import { RentalType } from "../../../generated/prisma/enums";

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
