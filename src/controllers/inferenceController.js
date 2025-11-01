// src/controllers/inferenceController.js

import { Image } from "../models/imageModel.js";
import { asyncHandler, ApiError, ApiResponse } from "../utils/utils.js";
import { addInferenceJob } from "../config/queue.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.service.js";

const submitInferenceJob = asyncHandler(async (req , res) => {
    const { farmId } = req.body; 
    const uploadedFile = req.file; 
 
    const localFilePath = uploadedFile?.path; 

    // 1. Validation
    if (!farmId || !localFilePath) { 
        throw new ApiError(400, "Farm ID and Image file are required.");
    }

    const cloudinaryResponse = await uploadBufferToCloudinary(localFilePath); 
    
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) { 
         throw new ApiError(500, "Failed to upload image to cloud service.");
    }
    
   
    const imageUrl = cloudinaryResponse.secure_url; 
  
    // DB entry & Job queuing
    const imageRecord = await Image.create({
        farm : farmId,
        uploadedBy : req.user._id,
        image_url : imageUrl,
        status : 'PENDING',
    });
    
    const job = await addInferenceJob({
        imageId : imageRecord._id,
        imageUrl : imageRecord.image_url
    });
    
    imageRecord.job_id = job.id;
    await imageRecord.save();

    // Response
    return res.status(202).json(
        new ApiResponse(
            202,
            { imageId: imageRecord._id, jobId: job.id, status: 'PENDING', imageUrl: imageUrl },
            "Image submitted for processing. Check status later."
        )
    );
});


const checkJobStatus = asyncHandler(async (req, res) => {
    const { imageId } = req.params;
    
    const image = await Image.findById(imageId).select('status job_id');
    
    if (!image) {
        throw new ApiError(404, "Image record not found.");
    }
    
    return res.status(200).json(new ApiResponse(200, {
        status: image.status,
        jobId: image.job_id,
    }, "Job status retrieved successfully."));
});


export {
    submitInferenceJob,
    checkJobStatus
}