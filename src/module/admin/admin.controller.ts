import { Request, Response } from "express";
import httpStatus from "http-status";
import { AdminService } from "./admin.service";
import { sendResponse } from "../../utils/sendResponse";

const getAllUsers = async (req: Request, res: Response) => {
    const result = await AdminService.getAllUsers(req.query as any);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users retrieved successfully",
        data: result.users,
        meta: result.meta,
    });
};

const getUserById = async (req: Request, res: Response) => {
    const result = await AdminService.getUserById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
};

const updateUserStatus = async (req: Request, res: Response) => {
    const result = await AdminService.updateUserStatus(req.params.id as string, req.body.status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User status updated successfully",
        data: result,
    });
};

const updateUserRole = async (req: Request, res: Response) => {
    const result = await AdminService.updateUserRole(req.params.id as string, req.body.role);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User role updated successfully",
        data: result,
    });
};

const deleteUser = async (req: Request, res: Response) => {
    const result = await AdminService.deleteUser(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: {},
    });
};

export const AdminController = {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser,
};
