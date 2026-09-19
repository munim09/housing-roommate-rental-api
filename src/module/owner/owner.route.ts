import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { catchAsync } from "../../utils/catchAsync";
import { OwnerController } from "./owner.controller";
import { OwnerValidation } from "./owner.validation";

const router = Router();

router.get(
    "/flats",
    auth(Role.OWNER, Role.MANAGER),
    catchAsync(OwnerController.getMyFlats),
);

router.get(
    "/advertisements",
    auth(Role.OWNER, Role.MANAGER),
    catchAsync(OwnerController.getMyAdvertisements),
);

router.use(auth(Role.OWNER));

router.post(
    "/properties",
    validateRequest(OwnerValidation.createProperty),
    catchAsync(OwnerController.createProperty),
);

router.get("/properties", catchAsync(OwnerController.getMyProperties));

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

router.post(
    "/flats/:flatId/revoke-manager",
    catchAsync(OwnerController.revokeManager),
);

router.post(
    "/flats/:flatId/images",
    upload.fields([
        {
            name: "images",
            maxCount: 10,
        },
    ]),
    catchAsync(OwnerController.addFlatImages),
);

router.post(
    "/rooms/:roomId/images",
    upload.fields([
        {
            name: "images",
            maxCount: 10,
        },
    ]),
    catchAsync(OwnerController.addRoomImages),
);

router.delete(
    "/flats/:flatId/images/:imageId",
    catchAsync(OwnerController.removeFlatImage),
);

router.delete(
    "/rooms/:roomId/images/:imageId",
    catchAsync(OwnerController.removeRoomImage),
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

router.delete("/flats/:flatId", catchAsync(OwnerController.deleteFlat));

router.delete("/rooms/:roomId", catchAsync(OwnerController.deleteRoom));

export const OwnerRoutes = router;
