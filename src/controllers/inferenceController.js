import { Image } from "../models/imageModel.js";
import { asyncHandler, ApiError, ApiResponse } from "../utils/utils.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.service.js";
import { ModelResult } from "../models/modelResult.js";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const UNET_API = process.env.ML_UNET_MODEL_URL || "https://unet-model-deployement.onrender.com/predict";
const CROP_API = process.env.ML_CROP_API_URL || "https://crop-api-m3xt.onrender.com/predict_from_path";
const YIELD_API = process.env.ML_YIELD_PREDICTION_URL || "https://yield-prediction-epdm.onrender.com/predict";


export const submitInferenceJob = asyncHandler(async (req, res) => {
  const { farmId, ndvi, weather, historical_yield } = req.body;
  const plantFile = req.files?.plant_image?.[0];
  const maskFile = req.files?.mask_image?.[0];

  if (!farmId || !plantFile || !maskFile) {
    throw new ApiError(400, "farmId, plant_image, and mask_image are required.");
  }

  console.log("✅ Received inference request for farm:", farmId);

  // Upload both to Cloudinary
  const plantUpload = await uploadBufferToCloudinary(plantFile.path);
  const maskUpload = await uploadBufferToCloudinary(maskFile.path);

  if (!plantUpload?.secure_url || !maskUpload?.secure_url) {
    throw new ApiError(500, "Failed to upload plant or mask image to Cloudinary.");
  }

  const plantUrl = plantUpload.secure_url;
  const maskUrl = maskUpload.secure_url;
  console.log("🌤 Uploaded to Cloudinary:", { plantUrl, maskUrl });

  // Create Image record in DB
  const imageRecord = await Image.create({
    farm: farmId,
    uploadedBy: req.user?._id || null,
    image_url: plantUrl,
    mask_url: maskUrl,
    status: "PROCESSING",
  });

  let detectionResult = { unet: {}, disease: {}, yield: {} };


  try {
    console.log(" Calling UNet API...");
    const unetForm = new FormData();
    unetForm.append("plant_image", fs.createReadStream(plantFile.path));
    unetForm.append("mask_image", fs.createReadStream(maskFile.path));

    const unetResp = await axios.post(`${UNET_API}`, unetForm, {
      headers: unetForm.getHeaders(),
      timeout: 180000,
    });

    detectionResult.unet = unetResp.data;
    console.log(" UNet Response:", unetResp.data);
  } catch (err) {
    console.error(" UNet Error:", err.message);
    detectionResult.unet = { error: err.message, statusCode: err.response?.status || 500 };
  }


  const healthy = detectionResult.unet?.healthy_area || detectionResult.unet?.Healthy_Area || 0;
  const weed = detectionResult.unet?.weed_area || detectionResult.unet?.Weed_Area || 0;
  const soil = detectionResult.unet?.soil_area || detectionResult.unet?.Soil_Area || 0;


  try {
    console.log("Calling Disease Model...");
    console.log("Image_path",plantUrl)
    const diseaseResp = await axios.post(
      CROP_API,
      { image_path: plantUrl },
      { headers: { "Content-Type": "application/json" }, timeout: 600 }
    );

    detectionResult.disease = diseaseResp.data;
    console.log(" Disease Model Response:", diseaseResp.data);
  } catch (err) {
    console.error(" Disease Model Error:", err.message);
    detectionResult.disease = { error: err.message, statusCode: err.response?.status || 500 };
  }

  const crop_type = detectionResult.disease?.crop_type || "wheat";
  const disease_class = detectionResult.disease?.disease_class || "blight";


  const yieldPayload = {
    historical_yield: parseFloat(historical_yield) || 1000,
    ndvi: parseFloat(ndvi) || 0.8,
    healthy_area: healthy,
    weed_area: weed,
    soil_area: soil,
    weather: weather || "moderate",
    crop_type,
    disease_class,
  };

  console.log("📦 Yield Model Payload:", yieldPayload);

  try {
    console.log(" Calling Yield Model...");
    const yieldResp = await axios.post(YIELD_API, yieldPayload, {
      headers: { "Content-Type": "application/json" },
      timeout: 180000,
    });

    detectionResult.yield = yieldResp.data;
    console.log(" Yield Model Response:", yieldResp.data);
  } catch (err) {
    console.error(" Yield Model Error:", err.message);
    detectionResult.yield = { error: err.message, statusCode: err.response?.status || 500 };
  }

  // Save results in DB
  const resultRecord = await ModelResult.create({
    image: imageRecord._id,
    detectionResult,
    modelName: "UNet + Crop + Yield",
  });

  await Image.findByIdAndUpdate(imageRecord._id, {
    status: "COMPLETED",
    inference_result: resultRecord._id,
  });

  console.log("✅ Inference completed and saved.");

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        imageId: imageRecord._id,
        status: "COMPLETED",
        imageUrl: plantUrl,
        maskUrl,
        detectionResult,
      },
      "Image processed and results saved successfully."
    )
  );
});


export const checkJobStatus = asyncHandler(async (req, res) => {
  const { imageId } = req.params;

  const image = await Image.findById(imageId)
    .select("status inference_result")
    .populate("inference_result");

  if (!image) throw new ApiError(404, "Image not found.");

  return res.status(200).json(
    new ApiResponse(
      200,
      { status: image.status, result: image.inference_result },
      "Job status retrieved successfully."
    )
  );
});
