import { Request, Response } from "express";
import httpStatus from "http-status";
import { PublicService } from "./public.service";
import { sendResponse } from "../../utils/sendResponse";

const getCities = async (req: Request, res: Response) => {
    const result = await PublicService.getCities(req.query as any);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cities retrieved successfully",
        data: result.cities,
        meta: result.meta,
    });
};

const getAreas = async (req: Request, res: Response) => {
    const result = await PublicService.getAreas(req.query as any);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Areas retrieved successfully",
        data: result.areas,
        meta: result.meta,
    });
};

const getAvailableAdvertisements = async (req: Request, res: Response) => {
    const result = await PublicService.getAvailableAdvertisements(
        req.query as any,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Available advertisements retrieved successfully",
        data: result.advertisements,
        meta: result.meta,
    });
};

const getAdvertisementById = async (req: Request, res: Response) => {
    const result = await PublicService.getAdvertisementById(
        req.params.advertisementId as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Advertisement retrieved successfully",
        data: result,
    });
};

export const PublicController = {
    getCities,
    getAreas,
    getAvailableAdvertisements,
    getAdvertisementById,
};