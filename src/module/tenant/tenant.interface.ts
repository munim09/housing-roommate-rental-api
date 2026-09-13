import {
    ApplicationStatus,
    BillStatus,
    ViewingRequestStatus,
} from "../../../generated/prisma/enums";

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

export interface IApplicationQuery {
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
}

export interface IInvoiceQuery {
    status?: BillStatus;
    page?: number;
    limit?: number;
}

export interface IStayInvoiceQuery {
    applicationId?: string;
    stayId?: string;
    status?: BillStatus;
    page?: number;
    limit?: number;
}