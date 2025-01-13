import { Product } from "../../models/productModel.js";
import { Category } from "../../models/categoryModel.js"
import { Brand } from "../../models/brandModel.js"
import { generateUUID } from '../../utils/refCode.js'
import { uploadImage } from '../../utils/cloudinary.js'
import fs from 'fs'
import mongoose from "mongoose";
const displayAddProducts = ( async (req,res) =>  {
    
    const brand = await Brand.find({});
    const category = await Category.find({});
    
    
    res.status(200).render('admin/products/addProduct.ejs',({brand,category}))
});

// list products function 
const listProducts = (async (req,res)=>{
    const products = await Product.aggregate([
        {
          $lookup: {
            from: 'categories', // Collection name should be correct (usually plural)
            localField: 'category', // Field in the Product collection
            foreignField: '_id', // Field in the Categories collection
            as: 'category', // Alias for the resulting array
          },
        },
        {
          $lookup: {
            from: 'brands', // Ensure this matches the collection name in MongoDB (usually plural)
            localField: 'brand', // Field in the Product collection
            foreignField: '_id', // Field in the Brands collection
            as: 'brand', // Alias for the resulting array
          },
        },
        {
          $unwind: '$brand', // Unwind the brand array to a single object
        },
        {
          $unwind: '$category', // Unwind the category array to a single object
        },
      ]);
      
    res.status(200).render('admin/products/products.ejs',({products}))
})


// adding a new product (post)

const createProduct = (async (req,res)=>{
    const productId = generateUUID();
    const {
      name,
      price,
      description,
      category,
      brand,
      regularPrice,
      sellingPrice,
      quantity,
      colors,
      status,
      tags,
      sizes,
    } = req.body;
   
    const imagePath = req?.files.map(file => {
        console.log(`file name : ${file.filename}, path : ${file.path}`);
        return file?.path;
    });

    // upload images to cloudinary and get the secure urls
    const productImageUrls = await Promise.all(
        imagePath.map(async (filePath) => {
            return await uploadImage(filePath);
        })
    );
    // delete the images from the server after uploading to cloudinary
    imagePath.forEach((filePath) => {
        fs.unlinkSync(filePath);
    });
    let size = Number(sizes.split('"').join(""));
    console.log(typeof(tags));
    // save the product to the database
    const product = new Product({
        productId,
        name,
        price,
        description,
        category,
        brand,
        regularPrice,
        sellingPrice,
        quantity,
        colors,
        status,
        tags:JSON.parse(tags),
        sizes:size ,
        productImageUrls: productImageUrls.map((image) => image.secure_url),
    });
    await product.save();
    console.log("product created successfully");
    
    

    res.status(200).send({"message":"success"})

})


//delete product

const deleteProduct = async (req,res) => {
    const productId = req.params.productId;
    await Product.findByIdAndDelete(productId);
    console.log("product deleted successfully");
    res.status(200).json({success:true,'message':'Product deleted successfully '})
}

//unblockProduct
const unblockProduct = async (req,res)=>{
   try {
    const productId = req.params.productId;
    if(!productId) return res.status(400).json({success:false,message:'product id required'});

    
    const status =  await Product.findByIdAndUpdate(productId, {isBlocked: false});
    console.log(status); //testing
    
    console.log("product unblocked successfully");
    return res.status(200).json({success:true,'message':'Product unblocked successfully '})
   } catch (error) {
     console.log(error)
    return res.status(500).json({success:false,message:'server error'});
   }
}

//blockProduct

const blockProduct = async (req,res)=>{
   try {
    const productId = req.params.productId;
    if(!productId) return res.status(400).json({success:false,message:'product id required'});
    console.log(productId);//testing
    await Product.findByIdAndUpdate(productId, {isBlocked: true});

    console.log("product blocked successfully");
    return res.status(200).json({success:true,'message':'Product blocked successfully '})
   } catch (error) {
     console.log(error)
    return res.status(500).json({success:false,message:'server error'});
   }
}

//display  edit product page 

const displayEditProduct = async (req,res)=>{
      const productId = req.params.productId;
      // const product = await Product.findById(productId);
      console.log(productId)
      const product = (await Product.aggregate([
        {
        $match:{_id:new mongoose.Types.ObjectId(productId)}
      },
      {
        $lookup:{
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as:'category'
        },
      },{
        $lookup:{
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as:'brand'
        },
      },
      {
        $unwind:'$category'
      },{
        $unwind:'$brand'
      }]))[0];
      
      // console.log(product)
      if(!product) return res.status(404).json({success:false,message:'product not found'});
      
      const brand = await Brand.find({});
      const category = await Category.find({});
      // testing
      // console.log(product)
     
      res.status(200).render('admin/products/editProduct.ejs',({product,brand,category})) 


}

//save edited products 
const saveEditedProduct = async (req,res)=>{
  console.log("testing update on edit ")
  const {
    name,
    price,
    description,
    category,
    brand,
    regularPrice,
    sellingPrice,
    quantity,
    colors,
    status,
    tags,
    sizes,
  } = req.body;

  const indexImg =JSON.parse( req?.body?.deleteImageIndexes);
console.log(indexImg ) //testing
  const productId = req.params.productId;

  if(req?.files?.length > 0){

    const productImageUrls = req?.files?.map(file => {
      console.log(`file name : ${file.filename}, path : ${file.path}`);
      return file?.path;
    });
    // upload images to cloudinary and get the secure urls
    const updatedProductImageUrls = await Promise.all(
      productImageUrls.map(async (filePath) => {
        return await uploadImage(filePath);
      })
    );
    // delete the images from the server after uploading to cloudinary
    productImageUrls.forEach((filePath) => {
      fs.unlinkSync(filePath);
    });
  
  
  // save the product to the database
  let size = Number(sizes.split('"').join(""));
    console.log(typeof(tags));

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      
      $push:{ productImageUrls: {$each :updatedProductImageUrls?.map((image) => image?.secure_url)}},
      
    },
    { new: true }
  );
}

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      name,
      price,
      description,
      category,
      brand,
      regularPrice,
      sellingPrice,
      quantity,
      colors,
      status,
      sizes,
      $pull: { productImageUrls: { $in: indexImg } },
      tags:JSON.parse(tags)
    },
    { new: true }
  );


  console.log("product updated successfully");
  res.status(200).json({ success: true, message: "Product updated successfully" });

}
//end



export {
  createProduct,
  displayAddProducts,
  listProducts,
  deleteProduct,
  unblockProduct,
  blockProduct,
  displayEditProduct,
  saveEditedProduct,
};