import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { OwnerController } from "./owner.controller";
import { OwnerValidation } from "./owner.validation";

const router = Router();

router.use(auth(Role.OWNER));

router.post(
    "/properties",
    validateRequest(OwnerValidation.createProperty),
    catchAsync(OwnerController.createProperty),
);

router.get("/properties", catchAsync(OwnerController.getMyProperties));

router.get("/flats", catchAsync(OwnerController.getMyFlats));

router.get("/managers", catchAsync(OwnerController.getActiveManagers));

// router.post(
//     "/properties/:propertyId/flats",
//     uploadImages,
//     validateRequest(OwnerValidation.addFlat),
//     catchAsync(OwnerController.addFlat),
// );

router.post(
    "/properties/:propertyId/flats",
    upload.fields([
        {
            name: "images",
            maxCount: 10,
        },
    ]),

    catchAsync(OwnerController.addFlat),
);

router.post(
    "/flats/:flatId/rooms",
    upload.fields([
        {
            name: "images",
            maxCount: 10,
        },
    ]),
    catchAsync(OwnerController.addRoom),
);

router.post(
    "/flats/:flatId/assign-manager",
    validateRequest(OwnerValidation.assignManager),
    catchAsync(OwnerController.assignManager),
);

router.patch(
    "/flats/:flatId",
    validateRequest(OwnerValidation.updateFlat),
    catchAsync(OwnerController.updateFlat),
);

router.patch(
    "/rooms/:roomId",
    validateRequest(OwnerValidation.updateRoom),
    catchAsync(OwnerController.updateRoom),
);

export const OwnerRoutes = router;
