import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type z from "zod";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: z.ZodObject) => {
    return catchAsync((req: Request, res: Response, next: NextFunction) => {
        // const payload = req.body ? req.body : {}
        const payload = req.body ?? {};

        const result = zodSchema.safeParse(payload);

        if (!result.success) {
            console.log(result.error);
            console.log(result.error.issues);

            throw new AppError(
                httpStatus.BAD_REQUEST,
                result.error.issues[0].message,
            );
        }

        req.body = result.data;

        next();
    });
};

export const validateRequestNew = (zodSchema: z.ZodTypeAny) => {
    return catchAsync((req: Request, res: Response, next: NextFunction) => {
        const payload = {
            body: req.body,
            query: req.query,
            params: req.params,
        };

        const result = zodSchema.safeParse(payload);

        if (!result.success) {
            console.log(result.error.issues);

            throw new AppError(
                httpStatus.BAD_REQUEST,
                result.error.issues[0].message,
            );
        }

        req.body = result.data.body;
        next();
    });
};
