import { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

const register = async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: { email: result.email },
    });
};

const verify = async (req: Request, res: Response) => {
    const result = await AuthService.verify(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: {},
    });
};

const updateProfile = async (req: Request, res: Response) => {
    const result = await AuthService.updateProfile(req.user!.userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: {},
    });
};

const login = async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    const { accessToken, refreshToken } = result;

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 50, // 50 mins
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 10, // 7 days
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Login successful",
        data: result,
    });
};

const refreshToken = async (req: Request, res: Response) => {
    if (!req.cookies.refreshToken) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is missing");
    }
    const result = await AuthService.refreshToken(req.cookies.refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = result;

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
    });
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "New tokens generated successfully",
        data: {
            accessToken,
            refreshToken: newRefreshToken,
        },
    });
};

const googleLogin = async (req: Request, res: Response) => {
    const payload = req.body;

    const result = await AuthService.googleLogin(payload);

    const { accessToken, refreshToken } = result;

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "New tokens generated successfully",
        data: {
            accessToken,
            refreshToken,
        },
    });
};
const forgotPassword = async (req: Request, res: Response) => {
    const payload = req.body;

    await AuthService.forgotPassword(payload);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `OTP Sent To Email : ${payload.email}`,
        data: null,
    });
};
const resetPassword = async (req: Request, res: Response) => {
    const payload = req.body;

    await AuthService.resetPassword(payload);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password Changed Successfully",
        data: null,
    });
};

export const AuthController = {
    login,
    register,
    verify,
    updateProfile,
    refreshToken,
    googleLogin,
    forgotPassword,
    resetPassword,
};
