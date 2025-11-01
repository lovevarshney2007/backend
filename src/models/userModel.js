import mongoose from "mongoose";
import bcrypt from "bcryptjs"; 
import jwt from "jsonwebtoken"; 


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
     trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  confirmPassword:{
    type: String,
    require:true
  },
  role: {
    type: String,
    default: "farmer",
  },
  refreshToken: {
        type: String, 
        select: false ,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type:  Date,
    }
} , {
    timestamps : true
});

userSchema.pre("save",async function (next) {
  if(!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Access Token generate karna
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        { _id: this._id, 
          email: this.email,
           role: this.role 
          },
        process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET || "default_access_key", 
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d"}
    );
};

// Refresh Token generate karna
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { _id: this._id },
        process.env.JWT_SECRET || process.env.REFRESH_TOKEN_SECRET || "default_refresh_key", 
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d"}
    );
};

export const User =  mongoose.model('User', userSchema);
