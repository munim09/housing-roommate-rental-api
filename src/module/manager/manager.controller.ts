import { Request, Response } from "express";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { ManagerService } from "./manager.service";

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

export const ManagerController = {
    getMyAdvertisements,
    getApplications,
};