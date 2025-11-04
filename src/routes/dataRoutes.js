
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { getAnalyticsSummary } from "../controllers/dataController.js";

const router = express.Router();
router.use(verifyJWT);


router.get("/analytics/summary", getAnalyticsSummary);

export default router;
