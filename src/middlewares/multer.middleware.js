import multer from "multer";
import { ApiError } from '../utils/utils.js'; 
import path from 'path'; 


// 1. Storage 
const storage = multer.diskStorage({
    destination: function(req,file,cb){

        cb(null,"./public/uploads"); 
    },
    filename: function(req,file,cb){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. File Filter (Validation)
const fileFilter = (req,file,cb) => {
    if(file.mimetype.startsWith('image/')){
        return cb(null,true);
    }
    else{
        return cb(new ApiError(400, 'Only image files are allowed!'), false);
    }
};

// 3. Multer Instance
export const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 
    }
});