import { Request, Response } from "express";
import httpStatus from "http-status";
import { AdvertisementService } from "../advertisement/advertisement.service";
import { sendResponse } from "../../utils/sendResponse";

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

export const ManagerController = {
    createFlatAdvertisement,
    createRoomAdvertisement,
};