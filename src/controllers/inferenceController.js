import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { ApiError, ApiResponse, asyncHandler } from "../utils/utils.js";
import { upload } from "../middlewares/multerMiddleware.js";


export const detectDisease = asyncHandler(async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      throw new ApiError(400, "Please upload an image to detect disease.");
    }

    
    const imageUrl = req.file.path;
     
    console.log(" Uploaded plant image URL:", imageUrl);
    const formData = new FormData();
    formData.append("plant_image", imageUrl);

    // Send to ML API
    const response = await axios.post(process.env.ML_CROP_API_URL, formData, {
      headers: formData.getHeaders(),
    });

    return res.status(200).json(
      new ApiResponse(200, {
        cloudinary_url: imageUrl,
        model_output: response.data,
      }, "Disease detection successful")
    );
  } catch (error) {
    console.error(" Disease detection failed:", error.message);
    throw new ApiError(500, "Disease detection failed: " + error.message);
  }
});



export const segmentField = asyncHandler(async (req, res) => {
  try {
    const plantImage = req.files?.["plant_image"]?.[0]?.path;
    const maskImage = req.files?.["mask_image"]?.[0]?.path;

    if (!plantImage || !maskImage) {
      throw new ApiError(400, "Both plant and mask images are required.");
    }

    console.log(" Uploaded Plant Image URL:", plantImage);
console.log(" Uploaded Mask Image URL:", maskImage);

    const formData = new FormData();
    console.log("plant_image",plantImage)

    formData.append("plant_image", plantImage);
    formData.append("mask_image", maskImage);

    const response = await axios.post(process.env.ML_UNET_MODEL_URL, formData, {
      headers: formData.getHeaders(),
    });

    return res.status(200).json(
      new ApiResponse(200, {
        cloudinary_urls: {
          plant_image: plantImage,
          mask_image: maskImage,
        },
        model_output: response.data,
      }, "Field segmentation successful")
    );
  } catch (error) {
    console.error(" Field segmentation failed:", error.message);
    throw new ApiError(500, "Segmentation failed: " + error.message);
  }
});

export const predictYield = asyncHandler(async (req, res) => {
  try {
    const response = await axios.post(process.env.ML_YIELD_PREDICTION_URL, req.body);

    return res.status(200).json(
      new ApiResponse(200, {
        model_output: response.data,
      }, "Yield prediction successful")
    );
  } catch (error) {
    console.error(" Yield prediction failed:", error.message);
    throw new ApiError(500, "Yield prediction failed: " + error.message);
  }
});
