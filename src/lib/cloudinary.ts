import { v2 as cloudinary } from "cloudinary";
import config from "../config";

cloudinary.config({
    cloud_name: config.cloudinary_cloud_name,
    api_key: config.cloudinary_api_key,
    api_secret: config.cloudinary_api_secret,
});

export const uploadImageToCloudinary = (
    buffer: Buffer,
    folder: string,
): Promise<{ url: string; publicId: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                } else {
                    reject(new Error("Cloudinary upload failed"));
                }
            },
        );
        uploadStream.end(buffer);
    });
};

export default cloudinary;