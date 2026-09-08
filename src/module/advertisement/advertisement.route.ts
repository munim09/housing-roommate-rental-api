import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
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
    "/rooms/:roomId/advertisements",
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

export const AdvertisementRoutes = router;
