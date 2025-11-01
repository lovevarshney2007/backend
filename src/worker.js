import { Worker } from 'bullmq';
import 'dotenv/config'; 
import connectDb from './config/db.js';
import { Image } from './models/imageModel.js'; 
import { ModelResult } from './models/modelResult.js';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};


connectDb(); 

const worker = new Worker('inferenceQueue', async (job) => {
    
    const { imageId, imageUrl } = job.data;
    console.log(`Worker: Starting ML inference for job ${job.id} on image ${imageId}`);

 
    await new Promise(resolve => setTimeout(resolve, 5000)); 

    const mockDiseaseResult = {
        disease: "Potato Blight",
        confidence: 0.95,
        modelName: "CNN Classifier"
    };

    // ModelResult creation (Linking the result)
    const finalResult = await ModelResult.create({
        image: imageId,
        detectionResult: mockDiseaseResult,
        modelName: mockDiseaseResult.modelName
    });

    // Final Status Update
    await Image.findByIdAndUpdate(imageId, {
        status: 'COMPLETED',
        inference_result: finalResult._id
    });

    console.log(`Worker: Job ${job.id} completed. Status updated to COMPLETED.`);
}, { connection, concurrency: 3 }); 

worker.on('failed', (job, err) => {
    console.error(`Worker: Job ${job?.id} failed with error: ${err.message}. Retrying...`);
});

console.log("ML Worker is running and listening for jobs...");