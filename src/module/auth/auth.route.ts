import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { authUpdateProfile } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
    "/login",
    validateRequest(AuthValidation.login),
    catchAsync(AuthController.login),
);

router.post(
    "/register",
    validateRequest(AuthValidation.register),
    catchAsync(AuthController.register),
);

router.post(
    "/verify",
    validateRequest(AuthValidation.verify),
    catchAsync(AuthController.verify),
);

router.patch(
    "/update-profile",
    authUpdateProfile(Role.OWNER, Role.MANAGER, Role.TENANT),
    validateRequest(AuthValidation.updateProfile),
    catchAsync(AuthController.updateProfile),
);

export const AuthRoutes = router;
