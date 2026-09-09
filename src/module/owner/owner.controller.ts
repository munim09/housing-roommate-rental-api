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

const revokeManager = async (req: Request, res: Response) => {
    const result = await OwnerService.revokeManager(
        req.user!.userId,
        req.params.flatId as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Manager assignment revoked successfully",
        data: result,
    });
};

const removeFlatImage = async (req: Request, res: Response) => {
    const result = await OwnerService.removeFlatImage(
        req.user!.userId,
        req.params.flatId as string,
        req.params.imageId as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Flat image removed successfully",
        data: result,
    });
};

const removeRoomImage = async (req: Request, res: Response) => {
    const result = await OwnerService.removeRoomImage(
        req.user!.userId,
        req.params.roomId as string,
        req.params.imageId as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Room image removed successfully",
        data: result,
    });
};

const addFlatImages = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFiles = files?.["images"] || [];
    const imageBuffers = imageFiles.map((file) => file.buffer);

    const result = await OwnerService.addFlatImages(
        req.user!.userId,
        req.params.flatId as string,
        imageBuffers,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Images added successfully",
        data: result,
    });
};

const addRoomImages = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFiles = files?.["images"] || [];
    const imageBuffers = imageFiles.map((file) => file.buffer);

    const result = await OwnerService.addRoomImages(
        req.user!.userId,
        req.params.roomId as string,
        imageBuffers,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Images added successfully",
        data: result,
    });
};

const updateFlat = async (req: Request, res: Response) => {
    const result = await OwnerService.updateFlat(
        req.user!.userId,
        req.params.flatId as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Flat updated successfully",
        data: result,
    });
};

const updateRoom = async (req: Request, res: Response) => {
    const result = await OwnerService.updateRoom(
        req.user!.userId,
        req.params.roomId as string,
        req.body,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Room updated successfully",
        data: result,
    });
};

const deleteFlat = async (req: Request, res: Response) => {
    const result = await OwnerService.deleteFlat(
        req.user!.userId,
        req.params.flatId as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Flat deleted successfully",
        data: result,
    });
};

const deleteRoom = async (req: Request, res: Response) => {
    const result = await OwnerService.deleteRoom(
        req.user!.userId,
        req.params.roomId as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Room deleted successfully",
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

const getMyAdvertisements = async (req: Request, res: Response) => {
    const result = await OwnerService.getMyAdvertisements(req.user!.userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Advertisements retrieved successfully",
        data: result,
    });
};

const getActiveManagers = async (req: Request, res: Response) => {
    const result = await OwnerService.getActiveManagers();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Active managers retrieved successfully",
        data: result,
    });
};

export const OwnerController = {
    createProperty,
    addFlat,
    addRoom,
    addFlatImages,
    addRoomImages,
    assignManager,
    revokeManager,
    removeFlatImage,
    removeRoomImage,
    updateFlat,
    updateRoom,
    deleteFlat,
    deleteRoom,
    getMyProperties,
    getMyFlats,
    getMyAdvertisements,
    getActiveManagers,
};
