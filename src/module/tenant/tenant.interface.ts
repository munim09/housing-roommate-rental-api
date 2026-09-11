import { ViewingRequestStatus } from "../../../generated/prisma/enums";

export interface ICreateViewingRequest {
    advertisementId: string;
    requestedDate: Date;
    note?: string;
}

export interface IViewingRequestQuery {
    status?: ViewingRequestStatus;
    page?: number;
    limit?: number;
}

export interface IUpdateViewingRequest {
    status?: "APPROVED" | "REJECTED" | "COMPLETED" | "NO_SHOW";
    approvedDate?: Date;
    noteByReviewer?: string;
}

export interface ICreateApplication {
    advertisementId: string;
    requestedStartDate: Date;
    requestedEndDate: Date;
    note?: string;
}