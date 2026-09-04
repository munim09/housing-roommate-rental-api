// import multer from "multer";
// import httpStatus from "http-status";
// import { AppError } from "../utils/AppError";

// const storage = multer.memoryStorage();

// const upload = multer({
//     storage,
//     limits: { fileSize: 5 * 1024 * 1024 },
//     fileFilter: (_req, file, cb) => {
//         if (file.mimetype.startsWith("image/")) {
//             cb(null, true);
//         } else {
//             cb(new AppError(httpStatus.BAD_REQUEST, "Only image files are allowed"));
//         }
//     },
// });

// export const uploadImages = upload.array("images", 10);
