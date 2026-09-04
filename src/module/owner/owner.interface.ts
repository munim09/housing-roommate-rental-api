export interface ICreateProperty {
    name: string;
    type: "SINGLE_FLAT" | "MULTI_FLAT";
    description?: string;
    address: string;
    city: string;
    district: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
}

export interface IAddFlat {
    flatNumber: string;
    floorNumber?: number;
    bedrooms?: number;
    bathrooms?: number;
    areaSqFt?: number;
    description?: string;
}

export interface IFlatImage {
    buffer: Buffer;
}

export interface IAddRoom {
    roomNumber: string;
    name?: string;
    areaSqFt?: number;
    description?: string;
}

export interface IAssignManager {
    managerId: string;
}

export type IUpdateFlat = Partial<IAddFlat>;

export type IUpdateRoom = Partial<IAddRoom>;