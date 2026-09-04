import { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { OwnerService } from "./owner.service";
import { OwnerValidation } from "./owner.validation";

const createProperty = async (req: Request, res: Response) => {
    const result = await OwnerService.createProperty(
        req.user!.userId,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Property created successfully",
        data: result,
    });
};

const addFlat = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFiles = files?.["images"] || [];

    const imageBuffers = imageFiles.map((file) => file.buffer);

    let parsedData: any;
    try {
        parsedData = JSON.parse(req.body.data);
    } catch (error) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid JSON format in data field");
    }

    const validationResult = OwnerValidation.addFlat.safeParse(parsedData);

    if (!validationResult.success) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            validationResult.error.issues[0]?.message || "Invalid data",
        );
    }

    const result = await OwnerService.addFlat(
        req.user!.userId,
        req.params.propertyId as string,
        validationResult.data,
        imageBuffers,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Flat added successfully",
        data: result,
    });
};

const addRoom = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFiles = files?.["images"] || [];

    const imageBuffers = imageFiles.map((file) => file.buffer);

    let parsedData: any;
    try {
        parsedData = JSON.parse(req.body.data);
    } catch (error) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid JSON format in data field");
    }

    const validationResult = OwnerValidation.addRoom.safeParse(parsedData);

    if (!validationResult.success) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            validationResult.error.issues[0]?.message || "Invalid data",
        );
    }

    const result = await OwnerService.addRoom(
        req.user!.userId,
        req.params.flatId as string,
        validationResult.data,
        imageBuffers,
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Room added successfully",
        data: result,
    });
};

const assignManager = async (req: Request, res: Response) => {
    const result = await OwnerService.assignManager(
        req.user!.userId,
        req.params.flatId as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Manager assigned successfully",
        data: result,
    });
};

const getMyProperties = async (req: Request, res: Response) => {
    const result = await OwnerService.getMyProperties(req.user!.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Properties retrieved successfully",
        data: result,
    });
};

const getMyFlats = async (req: Request, res: Response) => {
    const result = await OwnerService.getMyFlats(req.user!.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Flats retrieved successfully",
        data: result,
    });
};

export const OwnerController = {
    createProperty,
    addFlat,
    addRoom,
    assignManager,
    getMyProperties,
    getMyFlats,
};
