import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { PublicController } from "./public.controller";

const router = Router();

router.get("/cities", catchAsync(PublicController.getCities));
router.get("/areas", catchAsync(PublicController.getAreas));
router.get(
    "/available-advertisements",
    catchAsync(PublicController.getAvailableAdvertisements),
);

router.get(
    "/available-advertisements/:advertisementId",
    catchAsync(PublicController.getAdvertisementById),
);

export const PublicRoutes = router;