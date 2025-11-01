import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDb from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { asyncHandler,ApiError,ApiResponse } from "./utils/utils.js"
import farmRoutes from "./routes/farmRoutes.js";
import inferenceRoutes from "./routes/inferenceRoutes.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { SuspiciousLog } from "./models/suspiciousLogModel.js";
import dataRoutes from "./routes/dataRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//load environment Variables
dotenv.config();

//  Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// connect to mongodb
connectDb();


// initiallize express app
const app = express();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 5, 
    standardHeaders: true, 
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",

    handler: async (req,res,next,options) => {
        const suspiciousIP = req.ip;

      try {
            await SuspiciousLog.create({
                ipAddress: suspiciousIP,
                endpoint: req.originalUrl,
                reason: "RATE_LIMIT_EXCEEDED",
            });
            console.log(`[ALERT] Stored suspicious activity for IP: ${suspiciousIP}`);

        } catch (error) {
            console.error("Error storing suspicious log:", error.message);
        }
        res.status(options.statusCode).send(options.message);
    },
});
// middlewares

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(limiter);
app.use(morgan("dev"));



// test routes
app.get("/",(req,res) => {
    res.send("Agrisense Backend is running");
})

app.use("/api/v1/auth",authRoutes)
app.use("/api/v1/farms", farmRoutes);
app.use("/api/v1/inference", inferenceRoutes);
app.use("/api/v1/data", dataRoutes);

app.use(errorMiddleware)

// server listening
const PORT = process.env.PORT || 8000;
app.listen(PORT , () =>{
    console.log(`Server running on port ${PORT}`);
})
