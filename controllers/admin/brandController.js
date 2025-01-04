import { Brand } from '../../models/brandModel.js'
import { Category } from '../../models/categoryModel.js'
import {Product} from '../../models/productModel.js'
import {uploadImage} from '../../utils/cloudinary.js'
import fs from 'fs';

const brandInfo =async (req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page -1)*limit;

    const totalBrands = await Brand.countDocuments();
    const totalPages = Math.ceil(totalBrands / limit);
    // const brands = await Brand.find({})
   const brandData = await Brand.find({})
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)
    .then(brands=>{
        res.render('admin/brand.ejs',{
            brands,
        currentPage: page,
        totalPages: totalPages,
        totalBrands: totalBrands})
    })
    .catch(err=>{
        console.error(`Error retrieving brand data - ${err.message
        }`);
        res.redirect('/pageerror');
    }
    )
}

const editBrandDisplay = async (req,res)=>{
    const brandId = req.query.id;
    const brand = await Brand.findById(brandId);
    res.render('admin/editBrand.ejs',{brand});
}


const updateBrand = async (req,res)=>{
    const {name, description} = req.body;
    const brandId = req.params.id;
    const updatedBy = req.user._id;
    const imageUrl = req.file.filename;
    console.log(name, description, updatedBy, imageUrl);
    Brand.findByIdAndUpdate
    (brandId,{
        name,
        description,
        updatedBy,
        imageUrl
    })
    .then(()=>{
        res.status(200).json({success:true, message: 'Brand updated successfully'})
    })
    .catch(err=>{
        console.error(`Error updating brand - ${err.message}`);
        res.status(400).json({success: false, message: 'Failed to update brand'})
    });
}

const deleteBrand = async (req,res)=>{
    const brandId = req.params.id;
    Brand.findByIdAndDelete(brandId)
    .then(()=>{
        res.status(200).json({success:true, message: 'Brand deleted successfully'})
    })
    .catch(err=>{
        console.error(`Error deleting brand - ${err.message}`);
        res.status(400).json({success: false, message: 'Failed to delete brand'})
    });
}


// creating new brand and saving to database 
const addBrand = async (req,res)=>{
    try {
        // upload image to cloudinary and get the secure url
        uploadImage(req.file.path).then(async (result) => {
            console.log(result);// testing the result
            fs.unlinkSync(req.file.path); // delete the file from the server after uploading to cloudinary

            const { name, description } = req.body;
            const imageUrl = result.secure_url;
            console.log(req.file)
            const createdBy = req.user._id;
            console.log(name, description, createdBy);
            const brand = new Brand({
                name: name,
                description,
                createdBy,
                imageUrl
            })
            console.log(brand)
            await brand.save().then(() => {
                res.status(201).json({ success: true, message: 'Brand added successfully' })
            }).catch(err => {
                console.error(`Error adding brand - ${err.message}`);
                res.status(400).json({ success: false, message: 'Failed to add brand' })
            });
        });        
    } catch (error) {
        
    }
}


export {brandInfo, addBrand, updateBrand}