import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import {
    validateRequest,
    validateRequestNew,
} from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { ManagerController } from "./manager.controller";
import { ManagerValidation } from "./manager.validation";

const router = Router();

router.get(
    "/applications",
    auth(Role.OWNER, Role.MANAGER),
    validateRequest(ManagerValidation.getApplications),
    catchAsync(ManagerController.getApplications),
);

router.post(
    "/utility-invoices",
    auth(Role.OWNER, Role.MANAGER),
    validateRequest(ManagerValidation.createUtilityInvoice),
    catchAsync(ManagerController.createUtilityInvoice),
);

router.patch(
    "/utility-invoices/:invoiceId",
    auth(Role.OWNER, Role.MANAGER),
    validateRequestNew(ManagerValidation.updateUtilityInvoice),
    catchAsync(ManagerController.updateUtilityInvoice),
);

router.get(
    "/maintenance-requests",
    auth(Role.OWNER, Role.MANAGER),
    validateRequest(ManagerValidation.getMaintenanceRequests),
    catchAsync(ManagerController.getMaintenanceRequests),
);

router.patch(
    "/maintenance-requests/:maintenanceId",
    auth(Role.OWNER, Role.MANAGER),
    validateRequestNew(ManagerValidation.updateMaintenanceRequest),
    catchAsync(ManagerController.updateMaintenanceRequest),
);

router.use(auth(Role.MANAGER));

router.get("/flats", catchAsync(ManagerController.getMyFlats));

router.get(
    "/advertisements",
    catchAsync(ManagerController.getMyAdvertisements),
);

export const ManagerRoutes = router;