import { Request, Response } from "express";
import httpStatus from "http-status";
import {
    RentalType,
    StayStatus,
} from "../../../generated/prisma/client";
import { sendResponse } from "../../utils/sendResponse";
import { TenantService } from "./tenant.service";

const createViewingRequest = async (req: Request, res: Response) => {
    const result = await TenantService.createViewingRequest(
        req.user!.userId,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Viewing request created successfully",
        data: result,
    });
};

const getViewingRequests = async (req: Request, res: Response) => {
    const result = await TenantService.getViewingRequests(
        req.user!.userId,
        req.user!.role,
        req.query as any,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Viewing requests retrieved successfully",
        data: result.viewingRequests,
        meta: result.meta,
    });
};

const getViewingRequestById = async (req: Request, res: Response) => {
    const result = await TenantService.getViewingRequestById(
        req.user!.userId,
        req.user!.role,
        req.params.id as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Viewing request retrieved successfully",
        data: result,
    });
};

const updateViewingRequestStatus = async (req: Request, res: Response) => {
    const result = await TenantService.updateViewingRequestStatus(
        req.user!.userId,
        req.user!.role,
        req.params.id as string,
        req.body.status,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Viewing request status updated successfully",
        data: result,
    });
};

const updateViewingRequest = async (req: Request, res: Response) => {
    const result = await TenantService.updateViewingRequest(
        req.user!.userId,
        req.user!.role,
        req.params.id as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Viewing request updated successfully",
        data: result,
    });
};

const createApplication = async (req: Request, res: Response) => {
    const result = await TenantService.createApplication(
        req.user!.userId,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Application created successfully",
        data: result,
    });
};

const getApplications = async (req: Request, res: Response) => {
    const result = await TenantService.getApplications(
        req.user!.userId,
        req.query as any,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Applications retrieved successfully",
        data: result.applications,
        meta: result.meta,
    });
};

const getApplicationById = async (req: Request, res: Response) => {
    const result = await TenantService.getApplicationById(
        req.user!.userId,
        req.user!.role,
        req.params.id as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Application retrieved successfully",
        data: result,
    });
};

const updateApplication = async (req: Request, res: Response) => {
    const result = await TenantService.updateApplication(
        req.user!.userId,
        req.user!.role,
        req.params.id as string,
        req.body.status,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Application updated successfully",
        data: result,
    });
};

const getInvoices = async (req: Request, res: Response) => {
    const result = await TenantService.getInvoices(
        req.user!.userId,
        req.user!.role,
        req.query as any,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Invoices retrieved successfully",
        data: result.invoices,
        meta: result.meta,
    });
};

const getInvoiceById = async (req: Request, res: Response) => {
    const result = await TenantService.getInvoiceById(
        req.user!.userId,
        req.user!.role,
        req.params.id as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Invoice retrieved successfully",
        data: result,
    });
};

const getInvoicesByStay = async (req: Request, res: Response) => {
    const result = await TenantService.getInvoicesByStay(
        req.user!.userId,
        req.user!.role,
        req.query as any,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Invoices retrieved successfully",
        data: result.invoices,
    });
};

const getStays = async (req: Request, res: Response) => {
    const result = await TenantService.getStays(
        req.user!.userId,
        req.user!.role,
    );

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const stays = result.stays.map((stay) => ({
        ...stay,
        contractUrl:
            stay.status === StayStatus.CONFIRMED &&
            (stay.rentalType === RentalType.PRIMARY_ENTIRE_FLAT ||
                stay.rentalType === RentalType.PRIMARY_ROOM)
                ? `${baseUrl}/api/v1/tenant/stays/${stay.id}/contract`
                : null,
    }));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stays retrieved successfully",
        data: stays,
    });
};

const downloadStayContract = async (req: Request, res: Response) => {
    const result = await TenantService.getStayContract(
        req.params.stayId as string,
        req.user!.userId,
        req.user!.role,
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`,
    );
    res.setHeader("Content-Type", "application/pdf");

    res.send(result.buffer);
};

export const TenantController = {
    createViewingRequest,
    getViewingRequests,
    getViewingRequestById,
    updateViewingRequestStatus,
    updateViewingRequest,
    createApplication,
    getApplications,
    getApplicationById,
    updateApplication,
    getInvoices,
    getInvoicesByStay,
    getInvoiceById,
    getStays,
    downloadStayContract,
};
