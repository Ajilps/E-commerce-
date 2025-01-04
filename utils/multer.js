import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
// import Cloudinary from './cloudinary'; 
// import cloudinary from './cloudinary';


// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Define the upload folder
        cb(null, join(__dirname, '../public/uploads/re-images'));
    },
    filename: (req, file, cb) => {
        // Generate a unique filename
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});




//initialize multer
const uploads = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('File type is not supported'), false);
        }
    }
})


export {uploads};