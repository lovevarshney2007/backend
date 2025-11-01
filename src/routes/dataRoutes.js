import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { getDetectionResult, getYieldForecast , getAnalyticsSummary } from "../controllers/dataController.js";

const router = express.Router();

router.use(verifyJWT); 


router.get("/disease-detection/:imageId", getDetectionResult);
router.get("/yield-forecast", getYieldForecast);
router.get("/analytics/summary", getAnalyticsSummary);

export default router;
