import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { AuthRoutes } from "./module/auth/auth.route";
import { AdminRoutes } from "./module/admin/admin.route";
import { AdvertisementRoutes } from "./module/advertisement/advertisement.route";
import { OwnerRoutes } from "./module/owner/owner.route";
import { catchAsync } from "./utils/catchAsync";
import { sendResponse } from "./utils/sendResponse";

const app: Application = express();

// app.use("/api/subscription/webhook", express.raw({ type: 'application/json' }))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: `${process.env.APP_URL}`,
        credentials: true,
    }),
);

app.get("/", async (req: Request, res: Response) => {
    res.send("Hello, World!");
});

app.get(
    "/test",
    catchAsync(async (req: Request, res: Response) => {
        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "testing.....",
            data: {},
        });
    }),
);

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/owner", OwnerRoutes);
app.use("/api/v1/advertisements", AdvertisementRoutes);

app.use(notFound);

app.use(globalErrorHandler);

export default app;
