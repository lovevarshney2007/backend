import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./utils.js";


//  Upload Function
const uploadBufferToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "agrisense_images",
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary upload failed (Key/Network Error):", error);

    if (localFilePath) fs.unlinkSync(localFilePath);

    throw new ApiError(
      500,
      "Failed to upload image to cloud service. Check API Keys."
    );
  }
};

export { uploadBufferToCloudinary };
