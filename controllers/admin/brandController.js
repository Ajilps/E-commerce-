import { Brand } from '../../models/brandModel.js'
import { Category } from '../../models/categoryModel.js'
import {Product} from '../../models/productModel.js'



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


const addBrand = async (req,res)=>{
    const {name, description} = req.body;
    const createdBy = req.user._id;
    console.log(name,description,createdBy);
    const brand = new Brand({
        name : name,
        description,
        createdBy
    })
    console.log(brand)
   await brand.save().then(()=>{
       res.status(201).json({success:true ,message: 'Brand added successfully'})
    }).catch(err=>{
        console.error(`Error adding brand - ${err.message}`);
        res.status(400).json({success: false, message: 'Failed to add brand'})
});
}


export {brandInfo, addBrand}