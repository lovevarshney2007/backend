import { asyncHandler, ApiError, ApiResponse } from "../utils/utils.js";
import { Image } from "../models/imageModel.js";
import { ModelResult } from "../models/modelResult.js"; 


const getDetectionResult = asyncHandler(async (req, res) => {
    const { imageId } = req.params;

    
    const imageRecord = await Image.findById(imageId)
        .populate('inference_result'); 

    if (!imageRecord) {
        throw new ApiError(404, "Image record not found.");
    }

    if (imageRecord.status !== 'COMPLETED' || !imageRecord.inference_result) {
        throw new ApiError(400, "Inference processing is not yet complete for this image.");
    }
    

    return res.status(200).json(
        new ApiResponse(
            200, 
            imageRecord.inference_result.detectionResult, 
            "Disease detection results fetched successfully"
        )
    );
});


const getYieldForecast = asyncHandler(async (req, res) => {
    
    const mockForecastData = [
        { month: "Apr-24", yield_tons: 4.5, temp_C: 35 },
        { month: "May-24", yield_tons: 5.2, temp_C: 38 },
        { month: "Jun-24", yield_tons: 6.1, temp_C: 30 }
    ];

    return res.status(200).json(
        new ApiResponse(
            200, 
            { farmId: req.query.farmId || "N/A", forecast: mockForecastData },
            "Yield forecast data fetched successfully "
        )
    );
});

const getAnalyticsSummary = asyncHandler(async (req,res ) => {
    const { farmId, season } = req.query;

    if(!farmId){
        throw new ApiError(400, "Farm ID is required for focused analytics.");
    }

    const mockAnalysicData = { // Correctly named variable
        farmId : farmId,
        total_infections_last_season: 45,
        current_infection_rate: '8%',
        most_common_disease: 'Potato Blight',
        yield_comparison: {
            current_vs_prev_season: '12% Increase', 
            current_season_forecast: 5.8 
        }
    };
    
    // FIX: Using the correct variable name: mockAnalysicData
    return res.status(200).json(
        new ApiResponse(200, mockAnalysicData, "Farm analytics summary generated.")
    );
})


export {
    getDetectionResult,
    getYieldForecast,
    getAnalyticsSummary
}