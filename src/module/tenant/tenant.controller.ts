import { Request, Response } from "express";
import httpStatus from "http-status";
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

export const TenantController = {
    createViewingRequest,
    getViewingRequests,
    getViewingRequestById,
    updateViewingRequestStatus,
};