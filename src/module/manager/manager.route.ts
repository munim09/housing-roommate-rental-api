import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { AdvertisementValidation } from "../advertisement/advertisement.validation";
import { ManagerController } from "./manager.controller";

const router = Router();

router.use(auth(Role.MANAGER));

router.post(
    "/flats/:flatId/advertisements",
    validateRequest(AdvertisementValidation.createAdvertisement),
    catchAsync(ManagerController.createFlatAdvertisement),
);

router.post(
    "/rooms/:roomId/advertisements",
    validateRequest(AdvertisementValidation.createAdvertisement),
    catchAsync(ManagerController.createRoomAdvertisement),
);

export const ManagerRoutes = router;