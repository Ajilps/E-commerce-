import {v2 as cloudinary} from 'cloudinary';




export const uploadImage = async (file) => {
    
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:  process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    })
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: 're-images',
            resource_type: 'image',
            public_id: `${Date.now()}-${file.originalname}`
        });
        return result;
    } catch (error) {
        console.error(`Error uploading image - ${error.message}`);
    }
}

export const deleteImage = async (publicId) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:  process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    })
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error(`Error deleting image - ${error.message}`);
    }
}



