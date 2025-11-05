import JWT from "jsonwebtoken";
import { asyncHandler, ApiError } from "../utils/utils.js";
import { User } from "../models/userModel.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request - Token missing");
    }

    let decodedToken;
    try {
      decodedToken = JWT.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired token");
    }

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) throw new ApiError(401, "User not found or invalid token");

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized request", error: error.message });
  }
});

export { verifyJWT };
