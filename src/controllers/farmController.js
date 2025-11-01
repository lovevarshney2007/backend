import {Farm} from "../models/farmModel.js"
import {asyncHandler,ApiError,ApiResponse} from "../utils/utils.js"

const createFarm = asyncHandler(async(req,res) => {
    const  {farm_name,location} = req.body;

    if(!farm_name || !location){
        throw new ApiError(400,"Farm name and location are required");
    }

    const farm = await Farm.create({
        farm_name,
        location,
        owner: req.user._id,
    });

    return res
    .status(201)
    .json(
        new ApiResponse(201,farm,"Farm created successsfully")
    );
});

const getSingleFarm = asyncHandler(async (req,res) => {
    const {id } = req.params;
    const farm = await Farm.findOne({
        _id: id,
        owner: req.user._id
    })

    if(!farm){
        throw new ApiError(404, "Farm is not found .");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, farm, "Farm details fetched."));
})

const getAllFarms = asyncHandler(async(req,res) => {
    const  farms = await Farm.find({
        owner : req.user._id
    });
    return res
    .status(200)
    .json(new ApiResponse(200,farms, "Farms fetched Successfully"));
});

const updateFarm = asyncHandler(async (req,res) => {
    const {id} = req.params;
    const updateData = req.body;

    const farm = await Farm.findOneAndUpdate(
        { _id : id,
            owner : req.user._id
        },
        updateData,
        { new: true, runValidators : true }
    );

    if(!farm){
        throw new ApiError(404,"Farm not found or you are not the owner");
    }
    return  res
    .status(200)
    .json(
        new ApiResponse(200,farm,"Farm updated successfully")
    );
});

const deleteFarm = asyncHandler(async(req,res) => {
    const {id} = req.params;
    const farm = await Farm.findOneAndDelete({
        _id : id,
        owner :  req.user._id
    });
    if(!farm){
        throw new ApiError(400,
            "Farm not found or you are not the owner");
    };

    return res
    .status(200)
    .json(
        new ApiResponse(200,null,"Farm deleted successfully")
    )
})
export {
    createFarm,
    getAllFarms,
    updateFarm,
    deleteFarm
}