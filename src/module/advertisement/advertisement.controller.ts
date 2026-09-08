import { Request, Response } from "express";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { AdvertisementService } from "./advertisement.service";

const createFlatAdvertisement = async (req: Request, res: Response) => {
    const result = await AdvertisementService.createFlatAdvertisement(
        req.user!.userId,
        req.user!.role,
        req.params.flatId as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Flat advertisement created successfully",
        data: result,
    });
};

const createRoomAdvertisement = async (req: Request, res: Response) => {
    const result = await AdvertisementService.createRoomAdvertisement(
        req.user!.userId,
        req.user!.role,
        req.params.roomId as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Room advertisement created successfully",
        data: result,
    });
};

const updateAdvertisementStatus = async (req: Request, res: Response) => {
    const result = await AdvertisementService.updateAdvertisementStatus(
        req.user!.userId,
        req.user!.role,
        req.params.advertisementId as string,
        req.body.status,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Advertisement status updated successfully",
        data: result,
    });
};

const updateAdvertisement = async (req: Request, res: Response) => {
    const result = await AdvertisementService.updateAdvertisement(
        req.user!.userId,
        req.user!.role,
        req.params.advertisementId as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Advertisement updated successfully",
        data: result,
    });
};

export const AdvertisementController = {
    createFlatAdvertisement,
    createRoomAdvertisement,
    updateAdvertisementStatus,
    updateAdvertisement,
};