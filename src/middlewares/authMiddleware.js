import JWT from "jsonwebtoken";
import { asyncHandler, ApiError } from "../utils/utils.js";
import { User } from "../models/userModel.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    let token;

  
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

   
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

   
    if (!token) {
      throw new ApiError(401, "Unauthorized request — Token missing");
    }

   
    const decoded = JWT.verify(token, process.env.JWT_SECRET);

   
    const user = await User.findById(decoded._id).select("-password");
    if (!user) throw new ApiError(401, "User not found or token invalid");

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Failed:", error.message);
    throw new ApiError(401, "Unauthorized request — Invalid or expired token");
  }
});
