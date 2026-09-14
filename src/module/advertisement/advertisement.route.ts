import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import {
    validateRequest,
    validateRequestNew,
} from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { AdvertisementController } from "./advertisement.controller";
import { AdvertisementValidation } from "./advertisement.validation";

const router = Router();

router.use(auth(Role.OWNER, Role.MANAGER));

router.post(
    "/flats/:flatId",
    validateRequest(AdvertisementValidation.createAdvertisement),
    catchAsync(AdvertisementController.createFlatAdvertisement),
);

router.post(
    "/rooms/:roomId",
    validateRequest(AdvertisementValidation.createAdvertisement),
    catchAsync(AdvertisementController.createRoomAdvertisement),
);

router.patch(
    "/:advertisementId/status",
    validateRequest(AdvertisementValidation.updateAdvertisementStatus),
    catchAsync(AdvertisementController.updateAdvertisementStatus),
);

router.patch(
    "/:advertisementId",
    validateRequest(AdvertisementValidation.updateAdvertisement),
    catchAsync(AdvertisementController.updateAdvertisement),
);

router.post(
    "/utility-invoices",
    validateRequest(AdvertisementValidation.createUtilityInvoice),
    catchAsync(AdvertisementController.createUtilityInvoice),
);

router.patch(
    "/utility-invoices/:invoiceId",
    validateRequestNew(AdvertisementValidation.updateUtilityInvoice),
    catchAsync(AdvertisementController.updateUtilityInvoice),
);

export const AdvertisementRoutes = router;
