import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { JwtPayload } from "jsonwebtoken";
import { Role, UserStatus } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";

export interface RequestUser {
    email: string;
    name: string;
    userId: string;
    role: Role;
}

declare global {
    namespace Express {
        interface Request {
            user?: RequestUser;
        }
    }
}

// auth(Role.ADMIN, Role.USER, Role.Author)
// auth() => ...requiredRoles => [Role.ADMIN, Role.USER, Role.AUTHOR]
export const auth = (...requiredRoles: Role[]) => {
    return catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const token = req.cookies.accessToken
                ? req.cookies.accessToken
                : req.headers.authorization?.startsWith("Bearer ")
                  ? req.headers.authorization?.split(" ")[1]
                  : req.headers.authorization;

            if (!token) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    "You are not logged in. Please log in to access this resource.",
                );
            }

            const verifiedToken = jwtUtils.verifyToken(
                token,
                config.JWT_ACCESS_SECRET as string,
            );

            if (!verifiedToken.success) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    verifiedToken.error,
                );
            }

            const { email, name, userId, role } =
                verifiedToken.data as JwtPayload;

            if (requiredRoles.length && !requiredRoles.includes(role)) {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    "Forbidden. You don't have permission to access this resource.",
                );
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                    email,
                    name,
                    role,
                },
            });

            if (!user) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    "User not found. Please log in again.",
                );
            }

            if (!user.emailVerified) {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    "Email not verified. Please verify your email first.",
                );
            }

            if (user.status != UserStatus.ACTIVE) {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    "Your account is not active. Please contact support.",
                );
            }

            req.user = {
                email,
                name,
                userId,
                role,
            };

            next();
        },
    );
};

export const authUpdateProfile = (...requiredRoles: Role[]) => {
    return catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const token = req.cookies.accessToken
                ? req.cookies.accessToken
                : req.headers.authorization?.startsWith("Bearer ")
                  ? req.headers.authorization?.split(" ")[1]
                  : req.headers.authorization;

            if (!token) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    "You are not logged in. Please log in to access this resource.",
                );
            }

            const verifiedToken = jwtUtils.verifyToken(
                token,
                config.JWT_ACCESS_SECRET as string,
            );

            if (!verifiedToken.success) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    verifiedToken.error,
                );
            }

            const { email, name, userId, role } =
                verifiedToken.data as JwtPayload;

            if (requiredRoles.length && !requiredRoles.includes(role)) {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    "Forbidden. You don't have permission to access this resource.",
                );
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                    email,
                    name,
                    role,
                },
            });

            if (!user) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    "User not found. Please log in again.",
                );
            }

            if (!user.emailVerified) {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    "Email not verified. Please verify your email first.",
                );
            }

            req.user = {
                email,
                name,
                userId,
                role,
            };

            next();
        },
    );
};
