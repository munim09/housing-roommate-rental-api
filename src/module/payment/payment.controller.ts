import { Request, Response } from "express";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

const initiatePayment = async (req: Request, res: Response) => {
    const result = await PaymentService.initiatePayment(
        req.user!.userId,
        req.params.invoiceId as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment initiated successfully",
        data: result,
    });
};

const confirmPayment = async (req: Request, res: Response) => {
    const result = await PaymentService.confirmPayment(
        req.params.status as string,
        req.query.tranId as string,
        req.body as Record<string, any>,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment confirmed successfully",
        data: result,
    });

    // if (result)
    //     return res.redirect(
    //         `${process.env.FRONT_END_URL}/payment/success/${result?.rentalOrderId}`,
    //     );

    // return res.redirect(`${process.env.FRONT_END_URL}/payment/cancel/failed`);
};

const checkPayment = async (req: Request, res: Response) => {
    const result = await PaymentService.checkPayment(
        req.params.tranId as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment details from payment gateway",
        data: result,
    });
};

const getMyPayments = async (req: Request, res: Response) => {
    const result = await PaymentService.getMyPayments(
        req.user!.userId,
        req.query as any,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment history retrieved successfully",
        data: result.payments,
        meta: result.meta,
    });
};

const getPaymentDetails = async (req: Request, res: Response) => {
    const result = await PaymentService.getPaymentDetails(
        req.user!.userId,
        req.params.id as string,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment details retrieved successfully",
        data: result,
    });
};

export const PaymentController = {
    initiatePayment,
    confirmPayment,
    checkPayment,
    getMyPayments,
    getPaymentDetails,
};
