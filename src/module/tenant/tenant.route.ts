import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import {
    validateRequest,
    validateRequestNew,
} from "../../middlewares/validateRequest";
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

router.get(
    "/applications",
    auth(Role.TENANT),
    validateRequest(TenantValidation.getApplications),
    catchAsync(TenantController.getApplications),
);

router.get(
    "/applications/:id",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    catchAsync(TenantController.getApplicationById),
);

router.get(
    "/invoices",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    validateRequest(TenantValidation.getInvoices),
    catchAsync(TenantController.getInvoices),
);

router.get(
    "/invoices/by-stay",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    validateRequestNew(TenantValidation.getStayInvoices),
    catchAsync(TenantController.getInvoicesByStay),
);

router.get(
    "/invoices/:id",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    catchAsync(TenantController.getInvoiceById),
);

router.get(
    "/stays",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    catchAsync(TenantController.getStays),
);

router.get(
    "/stays/:stayId/contract",
    auth(Role.TENANT, Role.OWNER, Role.MANAGER),
    catchAsync(TenantController.downloadStayContract),
);

export const TenantRoutes = router;
