import { Image } from "../models/imageModel.js";
import { asyncHandler, ApiError, ApiResponse } from "../utils/utils.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.service.js";
import { ModelResult } from "../models/modelResult.js"; // Joda gaya
import axios from 'axios'; // Joda gaya
// import { addInferenceJob } from "../config/queue.js"; // Hata diya gaya

const submitInferenceJob = asyncHandler(async (req , res) => {
    const { farmId } = req.body; 
    const uploadedFile = req.file; 
 
    const localFilePath = uploadedFile?.path; 
    console.log("localpath for image : ",localFilePath);

    // 1. Validation
    if (!farmId || !localFilePath) { 
        throw new ApiError(400, "Farm ID and Image file are required.");
    }

    // 2. Upload Image
    const cloudinaryResponse = await uploadBufferToCloudinary(localFilePath); 
    
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) { 
         throw new ApiError(500, "Failed to upload image to cloud service.");
    }
    
    
    const imageUrl = cloudinaryResponse.secure_url; 
 
    // 3. DB entry (Initial PENDING status)
    const imageRecord = await Image.create({
        farm : farmId,
        uploadedBy : req.user._id,
        image_url : imageUrl,
        status : 'PENDING',
    });

    let detectionResult;

    // ==========================================================
    // --- DIRECT ML INFERENCE LOGIC (Replaces Queue Logic) ---
    // ==========================================================
    try {
        console.log(`Starting DIRECT ML inference for image ${imageRecord._id}. Waiting 5 seconds (mock)...`);

        // Simulating ML Model delay (REMOVE this line when using actual ML API call with axios)
        await new Promise(resolve => setTimeout(resolve, 5000)); 
        
        // Mock result from old worker.js (Replace this with actual API response later)
        detectionResult = {
            disease: "Potato Blight",
            confidence: 0.95,
            modelName: "CNN Classifier"
        };
        
        // ModelResult creation (Linking the result)
        const finalResult = await ModelResult.create({
            image: imageRecord._id,
            detectionResult: detectionResult,
            modelName: detectionResult.modelName 
        });

        // Final Status Update
        await Image.findByIdAndUpdate(imageRecord._id, {
            status: 'COMPLETED',
            inference_result: finalResult._id
        });
        
    } catch (error) {
        console.error("ML Inference Failed:", error.message);
        
        // Update status to FAILED in case of ML error
        await Image.findByIdAndUpdate(imageRecord._id, {
            status: 'FAILED'
        });
        
        throw new ApiError(503, "ML Service is unavailable or failed to process the image.");
    }
    // ==========================================================
    
    // 4. Response: Status 201 (Created) because processing is done.
    return res.status(201).json( // Changed 202 to 201
        new ApiResponse(
            201,
            { imageId: imageRecord._id, status: 'COMPLETED', imageUrl: imageUrl, detectionResult: detectionResult },
            "Image processed and result available."
        )
    );
});


const checkJobStatus = asyncHandler(async (req, res) => {
    // This controller is now mostly redundant but serves as status check.
    const { imageId } = req.params;
    
    const image = await Image.findById(imageId).select('status');
    
    if (!image) {
        throw new ApiError(404, "Image record not found.");
    }
    
    return res.status(200).json(new ApiResponse(200, {
        status: image.status,
    }, "Job status retrieved successfully."));
});


export {
    submitInferenceJob,
    checkJobStatus
}