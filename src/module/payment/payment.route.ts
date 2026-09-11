import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post(
    "/create/:invoiceId",
    auth(Role.TENANT),
    catchAsync(PaymentController.initiatePayment),
);

router.post(
    "/confirm/:status",
    catchAsync(PaymentController.confirmPayment),
);

router.get(
    "/check/:tranId",
    catchAsync(PaymentController.checkPayment),
);

router.get(
    "/",
    auth(Role.TENANT),
    catchAsync(PaymentController.getMyPayments),
);

router.get(
    "/:id",
    auth(Role.TENANT),
    catchAsync(PaymentController.getPaymentDetails),
);

export const PaymentRoutes = router;