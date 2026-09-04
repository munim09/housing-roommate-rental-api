import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = Router();

router.use(auth(Role.ADMIN));

router.get(
    "/users",
    validateRequest(AdminValidation.getAllUsers),
    catchAsync(AdminController.getAllUsers),
);

router.get("/users/:id", catchAsync(AdminController.getUserById));

router.patch(
    "/users/:id/status",
    validateRequest(AdminValidation.updateStatus),
    catchAsync(AdminController.updateUserStatus),
);

router.patch(
    "/users/:id/role",
    validateRequest(AdminValidation.updateRole),
    catchAsync(AdminController.updateUserRole),
);

// router.delete(
//     "/users/:id",
//     catchAsync(AdminController.deleteUser),
// );

export const AdminRoutes = router;
