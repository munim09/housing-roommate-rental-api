import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
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

router.use(auth(Role.MANAGER));

router.get(
    "/advertisements",
    catchAsync(ManagerController.getMyAdvertisements),
);

export const ManagerRoutes = router;