import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { ManagerController } from "./manager.controller";

const router = Router();

router.use(auth(Role.MANAGER));

router.get(
    "/advertisements",
    catchAsync(ManagerController.getMyAdvertisements),
);

export const ManagerRoutes = router;