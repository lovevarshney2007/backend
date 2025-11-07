import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { segmentField, predictYield } from "../controllers/inferenceController.js";
import axios from "axios";

const router = express.Router();

//  Verify JWT before all inference routes
router.use(verifyJWT);

//  Upload folder setup
const uploadPath = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

//  Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

//  Utility function to delete local files
const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error(" Error deleting file:", err);
    else console.log(" File deleted successfully:", filePath);
  });
};

router.post("/disease", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    console.log(" File uploaded:", req.file.filename);
    const localFilePath = path.join(uploadPath, req.file.filename);

    //  Create FormData to send to ML model
    const form = new FormData();
    form.append("file", fs.createReadStream(localFilePath));

    //  Add AbortController to handle timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 sec timeout

    console.log("🚀 Sending file to ML model API...");

    const response = await fetch("https://crop-api-m3xt.onrender.com/predict_upload", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const result = await response.json();

    //  Delete local temp file
    deleteFile(localFilePath);

    return res.status(200).json({
      success: true,
      message: "Disease detection successful",
      uploadedFile: `/uploads/${req.file.filename}`,
      apiResponse: result,
    });
  } catch (error) {
    console.error(" Error in /disease route:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


router.post(
  "/segment",
  upload.fields([
    { name: "plant_image", maxCount: 1 },
    { name: "mask_image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const plantFile = req.files?.plant_image?.[0];
      const maskFile = req.files?.mask_image?.[0];

      if (!plantFile || !maskFile)
        return res.status(400).json({ error: "Both plant_image and mask_image are required" });

      console.log(" Segment files received:", plantFile.filename, maskFile.filename);

      const plantPath = path.join(uploadPath, plantFile.filename);
      const maskPath = path.join(uploadPath, maskFile.filename);

      const form = new FormData();
      form.append("plant_image", fs.createReadStream(plantPath));
      form.append("mask_image", fs.createReadStream(maskPath));

      console.log(" Sending both files to UNet model API...");

      const response = await fetch("https://unet-model-deployement.onrender.com/predict", {
        method: "POST",
        body: form,
        headers: form.getHeaders(),
      });

      const result = await response.json();

    
      deleteFile(plantPath);
      deleteFile(maskPath);

      return res.status(200).json({
        success: true,
        message: "Both images sent to UNet model successfully.",
        apiResponse: result,
      });
    } catch (error) {
      console.error(" Error in segment route:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);


router.post("/yield", async (req, res) => {
  try {
    const {
      crop_type = "Cabbage",
      disease_class = "Healthy",
      ndvi = 0.75,
      weather = "Warm",
      historical_yield = 95.5,
      healthy_area = 0.65,
      weed_area = 0.20,
      soil_area = 0.15,
    } = req.body;

    const payload = {
      crop_type,
      disease_class,
      ndvi,
      weather,
      historical_yield,
      healthy_area,
      weed_area,
      soil_area,
    };

    console.log(" Sending payload to Yield Model:", payload);

    const response = await axios.post(
      "https://yield-prediction-epdm.onrender.com/predict",
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Yield predicted successfully",
      data: response.data,
    });
  } catch (error) {
    console.error(" Yield Prediction Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Error while predicting yield",
      error: error.response?.data || error.message,
    });
  }
});

export default router;
