import { Request, Response } from "express";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { RoommateService } from "./roommate.service";

const createAdvertisement = async (req: Request, res: Response) => {
    const result = await RoommateService.createRoommateAdvertisement(
        req.user!.userId,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Roommate advertisement created successfully",
        data: result,
    });
};

const getRoommateStays = async (req: Request, res: Response) => {
    const result = await RoommateService.getRoommateStays(req.user!.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Roommate stays retrieved successfully",
        data: result.stays,
    });
};

const getApplications = async (req: Request, res: Response) => {
    const result = await RoommateService.getApplications(req.user!.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Roommate applications retrieved successfully",
        data: result.applications,
    });
};

const updateApplicationStatus = async (req: Request, res: Response) => {
    const result = await RoommateService.updateApplicationStatus(
        req.user!.userId,
        req.params.applicationId as string,
        req.body.status,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Application status updated successfully",
        data: result,
    });
};

export const RoommateController = {
    createAdvertisement,
    getRoommateStays,
    getApplications,
    updateApplicationStatus,
};