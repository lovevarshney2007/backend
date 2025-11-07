import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import authRoutes from "./routes/authRoutes.js";
import inferenceRoutes from "./routes/inferenceRoutes.js";
import dataRoutes from "./routes/dataRoutes.js"; 

import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { SuspiciousLog } from "./models/suspiciousLogModel.js";


dotenv.config();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDb();


const app = express();
app.set("trust proxy", 1);


const limiter = rateLimit({
  windowMs: 15 *60 * 1000, 
  max: 50,
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
      console.log(`[ ALERT] Rate limit exceeded for IP: ${suspiciousIP}`);
    } catch (error) {
      console.error("Error storing suspicious log:", error.message);
    }
    res.status(options.statusCode).send(options.message);
  },
});


app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
       "http://localhost:5174",
      "https://agrisense-app-fawn.vercel.app",
      "https://your-app-domain.com",

    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(morgan("dev"));


app.get("/", (req, res) => {
  res.send(" AgriSense Backend (2025) is running successfully!");
});

//  API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/inference", inferenceRoutes); 
app.use("/api/v1/data", dataRoutes); 


app.use(errorMiddleware);


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
