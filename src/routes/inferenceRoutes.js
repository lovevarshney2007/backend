import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { submitInferenceJob, checkJobStatus } from "../controllers/inferenceController.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post(
  "/submit",
  upload.fields([
    { name: "plant_image", maxCount: 1 },
    { name: "mask_image", maxCount: 1 },
  ]),
  submitInferenceJob
);

router.get("/status/:imageId", checkJobStatus);

export default router;
