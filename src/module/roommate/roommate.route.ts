import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import {
    validateRequest,
    validateRequestNew,
} from "../../middlewares/validateRequest";
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

router.patch(
    "/advertisements/:advertisementId",
    auth(Role.TENANT),
    validateRequestNew(RoommateValidation.updateAdvertisement),
    catchAsync(RoommateController.updateAdvertisement),
);

router.get(
    "/stays",
    auth(Role.TENANT),
    catchAsync(RoommateController.getRoommateStays),
);

router.post(
    "/stays/:stayId/utility-bills",
    auth(Role.TENANT),
    validateRequestNew(RoommateValidation.createUtilityBill),
    catchAsync(RoommateController.createUtilityBill),
);

router.get(
    "/stays/:stayId/utility-bills",
    auth(Role.TENANT),
    catchAsync(RoommateController.getUtilityBills),
);

router.patch(
    "/utility-bills/:billId",
    auth(Role.TENANT),
    validateRequestNew(RoommateValidation.updateUtilityBill),
    catchAsync(RoommateController.updateUtilityBill),
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