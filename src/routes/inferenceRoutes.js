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


router.use(verifyJWT);

const delete_file=(path)=>{

const filePath = path;

fs.unlink(filePath, (err) => {
  if (err) {
    console.error('Error deleting the file:', err);
  } else {
    console.log('File deleted successfully!');
  }
});


}

const uploadPath = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); 
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


router.post("/disease", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    console.log("File uploaded:", req.file.filename);

    
    const localFilePath = path.join(uploadPath, req.file.filename);

    
    const form = new FormData();
    form.append("file", fs.createReadStream(localFilePath));

   
    const response = await fetch("https://crop-api-m3xt.onrender.com/predict_upload", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();

   
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Error deleting local file:", err);
      else console.log("Temporary file deleted:", req.file.filename);
    });

 
    res.status(200).json({
      success: true,
      message: "File uploaded, sent to ML API, and deleted locally.",
      uploadedFile: `/uploads/${req.file.filename}`,
      apiResponse: result,
    });
  } catch (error) {
    console.error("Error in /disease route:", error);
    res.status(500).json({ success: false, error: error.message });
  }


delete_file(`/uploads/${req.file.filename}`)

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

      console.log("Segment files received:", plantFile.filename, maskFile.filename);

      const plantPath = path.join(uploadPath, plantFile.filename);
      const maskPath = path.join(uploadPath, maskFile.filename);

      //  Create form-data to send both files to the external UNet API
      const form = new FormData();
      form.append("plant_image", fs.createReadStream(plantPath));
      form.append("mask_image", fs.createReadStream(maskPath));

      //  Send request to external ML API
      const response = await fetch("https://unet-model-deployement.onrender.com/predict", {
        method: "POST",
        body: form,
        headers: form.getHeaders(),
      });

      const result = await response.json();

      //  Delete local files after sending
      [plantPath, maskPath].forEach((filePath) => {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      });

      //  Send result back to frontend
      res.status(200).json({
        success: true,
        message: "Both images sent to UNet model successfully.",
        apiResponse: result,
      });
    } catch (error) {
      console.error("Error in /segment route:", error);
      res.status(500).json({ success: false, error: error.message });
    }



      delete_file(`/uploads/${req.file.filename}`)

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
    console.error("Yield Prediction Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Error while predicting yield",
      error: error.response?.data || error.message,
    });
  }
});

export default router;
