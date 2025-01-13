import { Category } from '../../models/categoryModel.js'
import {Product} from '../../models/productModel.js'

const categoryInfo =(async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page -1)*limit;
        const categoryData = await Category.find({})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments()
        const totalPages = Math.ceil(totalCategories / limit);
        res.render('admin/category.ejs',{
            categories: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        })

    } catch (error) {
        console.error(`Error retrieving category data - ${error.message}`);
        res.redirect('/pageerror');

        }

})


// add category

const addCategory = async (req,res)=>{
    const {name, description} = req.body;
    console.log(req.body); //test
    try {
        const existingCategory = await Category.findOne({name});
        if(existingCategory){
            return res.status(400).json({ success:false,message:'Category already exists'});
        }
        const newCategory = new Category({
            name, 
            description,
            createdBy: req.user._id,
        });
        const category = await newCategory.save();
        console.log(`New category added - ${category.name}`); // test
        return res.json({ success: true, message: 'Category added successfully'});
    } catch (error) {
        console.error(`Error adding category - ${error.message}`);
        return res.json({success:false,message:'internal server error '})
    }
}


//addOffer
const addOffer = async (req, res) => {
    const offer = parseInt(req.body.offer);
    const categoryId = req.body.categoryId;
    try {
        const category = await Category.updateOne({ _id: categoryId }, { $set: { categoryOffers: offer } });

        // change the selling price of all products in the category
        const products = await Product.find({ category: categoryId });
        console.log(products); //test
        products.forEach(async (product) => {
            const sellingPrice = product.regularPrice - (product.regularPrice * offer / 100);
            await Product.updateOne({ _id: product._id }, { $set: { sellingPrice: sellingPrice } });
        });
        console.log(category); //test

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }
        // updated successfully
        res.status(200).json({ success: true, message: 'Offer added successfully' })

    } catch (error) {
        console.error(`Error adding offer - ${error.message}`);
        return res.json({ success: false, message: 'internal server error ' })
    }
}

//removeOffer
const removeOffer = async (req,res)=>{
    const offer = 0;
    
    const categoryId = req.body.categoryId;
    console.log(categoryId); //test
    try {
        const category = await Category.updateOne({ _id: categoryId }, { $set: { categoryOffers: offer } });

        console.log(category); //test

        // change the selling price of all products in the category
        const products = await Product.find({ category: categoryId });
        console.log(products); //test
        products.forEach(async (product) => {
            const sellingPrice = product.regularPrice;
            await Product.updateOne({ _id: product._id }, { $set: { sellingPrice: sellingPrice } });
        });
        

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }
        // updated successfully
        res.status(200).json({ success: true, message: 'Offer removed successfully' })

    } catch (error) {
        console.error(`Error adding offer - ${error.message}`);
        return res.json({ success: false, message: 'internal server error ' })
    }
}

const unlistCategory = async (req,res)=>{
    const categoryId =req.query.id;
    const category = await Category.findByIdAndUpdate({_id : categoryId},{$set:{isListed: false}});
    
    console.log( `un list category ${category}`); //test
    res.redirect('/admin/category')
}

const listCategory = async (req,res)=>{
    const categoryId =req.query.id;
    const category = await Category.findByIdAndUpdate({_id : categoryId},{$set:{isListed: true}});

    console.log( ` list category ${category}`); //test
    res.redirect('/admin/category')

}


const editCategory = async (req,res)=>{
    const categoryId = req.query.id;

    // const catName =await Catego?ry.findOne({name})
    const category = await Category.findById({_id: categoryId});    
    console.log(category); //test
    res.render('admin/editCategory.ejs',{category})
}   

const updateCategory = async (req,res)=>{
    const categoryId = req.query.id;
    const {name, description} = req.body;
    console.log(req.body); //test
    const catName = await Category.findOne({name});
    if(catName){
        return res.status(400).json({success:false, message: 'Category already exists'});
    }

   try {
     const category = await Category.findByIdAndUpdate({_id: categoryId},{$set:{name:name , description: description}});
        //  console.log(category); //test
         if(!category){
             return res.status(400).json({success:false, message: 'Category not found'});
         }
        return res.status(200).json({success:true, message: 'Category updated successfully'}); 
   } catch (error) {
         console.error(`Error updating category - ${error.message}`);
         return res.json({success:false, message: 'internal server error '})
   }
}

const deleteCategory = async (req,res)=>{
    const categoryId = req.params.categoryId;
    const category = await Category.findByIdAndDelete({_id: categoryId});
    console.log(`this category is removed form data base -  ${category}`); //test
    if(! category) return res.status(404).json({success:false,message:'No category to delete'});
    return res.status(200).json({success:true,message:'category removed!!!'});
}

const searchCategory = async (req,res)=>{
    const {search} = req.query;
    const regex = new RegExp(search, 'i');
    try {
        const categories = await Category.find({$or: [{name: regex}, {description: regex}]});
        res.render('admin/category.ejs',{categories, search})
    } catch (error) {
        console.error(`Error searching for category - ${error.message}`);
        res.redirect('/pageerror');
    }
}



export {categoryInfo, addCategory, addOffer, removeOffer, unlistCategory, listCategory, editCategory, updateCategory, deleteCategory}