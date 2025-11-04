import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// ✅ Import Routes
import authRoutes from "./routes/authRoutes.js";
import inferenceRoutes from "./routes/inferenceRoutes.js";
import dataRoutes from "./routes/dataRoutes.js"; // optional (for analytics)

// ✅ Import Middleware & Utils
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { SuspiciousLog } from "./models/suspiciousLogModel.js";

// ✅ Load environment variables
dotenv.config();

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Connect MongoDB
connectDb();

// ✅ Initialize Express App
const app = express();
app.set("trust proxy", 1);

// ✅ Rate Limiter (to prevent abuse)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
  handler: async (req, res, next, options) => {
    const suspiciousIP = req.ip;
    try {
      await SuspiciousLog.create({
        ipAddress: suspiciousIP,
        endpoint: req.originalUrl,
        reason: "RATE_LIMIT_EXCEEDED",
      });
      console.log(`[⚠️ ALERT] Rate limit exceeded for IP: ${suspiciousIP}`);
    } catch (error) {
      console.error("Error storing suspicious log:", error.message);
    }
    res.status(options.statusCode).send(options.message);
  },
});

// ✅ Global Middlewares
app.use(
  cors({
    origin: "*", // change later for production (frontend domain)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
// app.use(limiter); // enable if needed
app.use(morgan("dev"));

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("🌾 AgriSense Backend (2025) is running successfully!");
});

// ✅ API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/inference", inferenceRoutes); // ✅ includes /disease, /segment, /yield
app.use("/api/v1/data", dataRoutes); // ⚙️ optional - analytics only

// ✅ Global Error Middleware
app.use(errorMiddleware);

// ✅ Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
