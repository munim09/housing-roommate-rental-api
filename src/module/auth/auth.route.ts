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

router.post("/refresh-token", catchAsync(AuthController.refreshToken));
router.post("/google", catchAsync(AuthController.googleLogin));
router.post(
    "/forgot-password",
    validateRequest(AuthValidation.ForgotPasswordZodSchema),
    catchAsync(AuthController.forgotPassword),
);
router.post(
    "/reset-password",
    validateRequest(AuthValidation.ResetPasswordZodSchema),
    AuthController.resetPassword,
);

export const AuthRoutes = router;
