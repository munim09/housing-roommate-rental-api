import { Request, Response } from "express";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { ManagerService } from "./manager.service";

const getMyFlats = async (req: Request, res: Response) => {
    const result = await ManagerService.getMyFlats(req.user!.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My assigned flats retrieved successfully",
        data: result,
    });
};

const getMyAdvertisements = async (req: Request, res: Response) => {
    const result = await ManagerService.getMyAdvertisements(req.user!.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Advertisements retrieved successfully",
        data: result,
    });
};

const getApplications = async (req: Request, res: Response) => {
    const result = await ManagerService.getApplications(
        req.user!.userId,
        req.user!.role,
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

const createUtilityInvoice = async (req: Request, res: Response) => {
    const result = await ManagerService.createUtilityInvoice(
        req.user!.userId,
        req.user!.role,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Utility invoice created successfully",
        data: result,
    });
};

const updateUtilityInvoice = async (req: Request, res: Response) => {
    const result = await ManagerService.updateUtilityInvoice(
        req.user!.userId,
        req.user!.role,
        req.params.invoiceId as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Utility invoice updated successfully",
        data: result,
    });
};

const getMaintenanceRequests = async (req: Request, res: Response) => {
    const result = await ManagerService.getMaintenanceRequests(
        req.user!.userId,
        req.user!.role,
        req.query as any,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Maintenance requests retrieved successfully",
        data: result.maintenanceRequests,
        // meta: result.meta,
    });
};

const updateMaintenanceRequest = async (req: Request, res: Response) => {
    const result = await ManagerService.updateMaintenanceRequest(
        req.user!.userId,
        req.user!.role,
        req.params.maintenanceId as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Maintenance request updated successfully",
        data: result,
    });
};

const getDashboardStats = async (req: Request, res: Response) => {
    const result = await ManagerService.getDashboardStats(req.user!.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard stats retrieved successfully",
        data: result,
    });
};

export const ManagerController = {
    getMyFlats,
    getMyAdvertisements,
    getApplications,
    createUtilityInvoice,
    updateUtilityInvoice,
    getMaintenanceRequests,
    updateMaintenanceRequest,
    getDashboardStats,
};
