import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { TenantController } from "./tenant.controller";
import { TenantValidation } from "./tenant.validation";

const router = Router();

router.post(
    "/viewing-requests",
    auth(Role.TENANT),
    validateRequest(TenantValidation.createViewingRequest),
    catchAsync(TenantController.createViewingRequest),
);

router.get(
    "/viewing-requests",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    validateRequest(TenantValidation.getViewingRequests),
    catchAsync(TenantController.getViewingRequests),
);

router.get(
    "/viewing-requests/:id",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    catchAsync(TenantController.getViewingRequestById),
);

router.patch(
    "/viewing-requests/:id/status",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    validateRequest(TenantValidation.updateViewingRequestStatus),
    catchAsync(TenantController.updateViewingRequestStatus),
);

router.patch(
    "/viewing-requests/:id",
    auth(Role.OWNER, Role.MANAGER),
    validateRequest(TenantValidation.updateViewingRequest),
    catchAsync(TenantController.updateViewingRequest),
);

router.post(
    "/applications",
    auth(Role.TENANT),
    validateRequest(TenantValidation.createApplication),
    catchAsync(TenantController.createApplication),
);

router.patch(
    "/applications/:id",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    validateRequest(TenantValidation.updateApplication),
    catchAsync(TenantController.updateApplication),
);

export const TenantRoutes = router;