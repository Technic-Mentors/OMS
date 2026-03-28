import dotenv from "dotenv";
dotenv.config();

import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = "oms_users",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const public_id = `user_${Date.now()}_${Math.round(Math.random() * 1000)}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id,
        resource_type: "auto",
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined,
      ) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else if (result) {
          console.log("Cloudinary upload success:", result.secure_url);
          resolve(result);
        } else {
          reject(new Error("Upload failed with no result"));
        }
      },
    );

    uploadStream.on("error", (error) => {
      console.error("Upload stream error:", error);
      reject(error);
    });

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
