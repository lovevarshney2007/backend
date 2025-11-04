import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./utils.js";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadBufferToCloudinary = async (localFilePath, folder = "agrisense_images") => {
  try {
    if (!localFilePath) throw new ApiError(400, "No file path provided for Cloudinary upload");

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder,
    });

  
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    console.log(" Uploaded to Cloudinary:", response.secure_url);
    return response;
  } catch (error) {
    console.error(" Cloudinary upload failed:", error);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw new ApiError(500, "Cloudinary upload failed");
  }
};

export { uploadBufferToCloudinary };
