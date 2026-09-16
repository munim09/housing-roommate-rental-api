import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { RoommateController } from "./roommate.controller";
import { RoommateValidation } from "./roommate.validation";

const router = Router();

router.post(
    "/advertisements",
    auth(Role.TENANT),
    validateRequest(RoommateValidation.createAdvertisement),
    catchAsync(RoommateController.createAdvertisement),
);

router.get(
    "/stays",
    auth(Role.TENANT),
    catchAsync(RoommateController.getRoommateStays),
);

router.get(
    "/applications",
    auth(Role.TENANT),
    catchAsync(RoommateController.getApplications),
);

router.patch(
    "/applications/:applicationId/status",
    auth(Role.TENANT),
    validateRequest(RoommateValidation.updateApplicationStatus),
    catchAsync(RoommateController.updateApplicationStatus),
);

export const RoommateRoutes = router;