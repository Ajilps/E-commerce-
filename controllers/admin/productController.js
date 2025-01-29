import { Product } from "../../models/productModel.js";
import { Category } from "../../models/categoryModel.js";
import { Brand } from "../../models/brandModel.js";
import { generateUUID } from "../../utils/refCode.js";
import { uploadImage } from "../../utils/cloudinary.js";
import fs from "fs";
import mongoose from "mongoose";
const displayAddProducts = async (req, res) => {
  const brand = await Brand.find({});
  const category = await Category.find({});

  res.status(200).render("admin/products/addProduct.ejs", { brand, category, user: req.user });
};

// list products function
const listProducts = async (req, res) => {
  let search = req?.query?.search || "";
  let page = req?.query?.page || 1;
  const limit = 3;

  const products = await Product.aggregate([
    {
      $match: { name: { $regex: ".*" + search + ".*", $options: "i" } },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand",
      },
    },
    {
      $unwind: "$brand",
    },
    {
      $unwind: "$category",
    },
  ]).skip((page-1)*limit)
  .limit(limit).allowDiskUse(true); // allowed the db to use disk 

  //taking the total count of the product
  const count = await Product.find({
    name: { $regex: ".*" + search + ".*", $options: "i" },
  }).countDocuments();

  res.status(200).render("admin/products/products.ejs", {
    products,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    user: req.user,
  });
};

// adding a new product (post)

const createProduct = async (req, res) => {
  const productId = generateUUID();
  const {
    name,
    offer,
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
    specifications,
  } = req.body;
  console.log(JSON.parse(specifications));

  const imagePath = req?.files.map((file) => {
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
  console.log(typeof tags);
  // save the product to the database
  const product = new Product({
    productId,
    name,
    offer,
    description,
    category,
    brand,
    regularPrice,
    sellingPrice,
    quantity,
    colors,
    status,
    specifications : JSON.parse(specifications),
    tags: JSON.parse(tags),
    sizes: size,
    productImageUrls: productImageUrls.map((image) => image.secure_url),
    createdBy: req?.user?._id,
  });
  await product.save();
  console.log("product created successfully");

  res.status(200).send({ message: "success" });
};

//delete product

const deleteProduct = async (req, res) => {
  const productId = req.params.productId;
 try {
      // if this product has a parent product delete the id from the parent product variants 
      const product = await Product.findById(productId);
      if(product.parentId){
       let parentProduct =  await Product.findByIdAndUpdate(product.parentId, {
          $pull: { variantId: productId },
        });
        // console.log(parentProduct);//testing
        
      }
   await Product.findByIdAndDelete(productId);
   console.log("product deleted successfully");
  return res
     .status(200)
     .json({ success: true, message: "Product deleted successfully " });
 } catch (error) {
  console.log(error);
  return res.status(500).json({ success: false, message: "server error" });
 }
};

//unblockProduct
const unblockProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId)
      return res
        .status(400)
        .json({ success: false, message: "product id required" });

    const status = await Product.findByIdAndUpdate(productId, {
      isBlocked: false,
    });
    console.log(status); //testing

    console.log("product unblocked successfully");
    return res
      .status(200)
      .json({ success: true, message: "Product unblocked successfully " });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

//blockProduct

const blockProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId)
      return res
        .status(400)
        .json({ success: false, message: "product id required" });
    console.log(productId); //testing
    await Product.findByIdAndUpdate(productId, { isBlocked: true });

    console.log("product blocked successfully");
    return res
      .status(200)
      .json({ success: true, message: "Product blocked successfully " });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

//display  edit product page

const displayEditProduct = async (req, res) => {
  const productId = req.params.productId;
  // const product = await Product.findById(productId);
  console.log(productId);
  const product = (
    await Product.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(`${productId}`) },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      }, 
      {
        $unwind: "$category",
      },
      {
        $unwind: "$brand",
      },
    ])
  )[0];

  console.log(product)// testing
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "product not found" });

  const brand = await Brand.find({});
  const category = await Category.find({});
  // testing
  console.log(product)

  res
    .status(200)
    .render("admin/products/editProduct.ejs", { product, brand, category, user: req.user });
};


// sending tags to client
const getTags = async (req,res)=>{
  const productId = req.params.productId;
console.log(productId);
  try{
    const tags = await Product.findById(productId,{'tags':1});
    res.status(200).json(tags);
  }catch(error){
    console.log(error);
    res.status(500).json({success:false, message:"server error"});
  }
}


//save edited products
const saveEditedProduct = async (req, res) => {
 try {
   console.log("testing update on edit ");
   const {
     name,
     offer,
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
     specifications,
   } = req.body;
 
   const indexImg = JSON.parse(req?.body?.deleteImageIndexes);
   console.log(tags); //testing
   const productId = req.params.productId;
 
   if (req?.files?.length > 0) {
     const productImageUrls = req?.files?.map((file) => {
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
     console.log(typeof tags);
 
     const updatedProduct = await Product.findByIdAndUpdate(
       productId,
       {
         $push: {
           productImageUrls: {
             $each: updatedProductImageUrls?.map((image) => image?.secure_url),
           },
         },
       },
       { new: true }
     );
   }
 
   const updatedProduct = await Product.findByIdAndUpdate(
     productId,
     {
       name,
       offer,
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
       tags: JSON.parse(tags),
       specifications: JSON.parse(specifications),
     },
     { new: true }
   );
 
   console.log("product updated successfully");
  return res
     .status(200)
     .json({ success: true, message: "Product updated successfully" });
 } catch (error) {
  return res
  .status(400)
  .json({ success: false, message: "Product updated failed" });
 }
};
//end


//  new variant page display
const displayAddVariant = async(req,res)=>{
  const productId = req?.params?.productId;
  console.log(typeof(productId));
 
  try {
    const parentProduct = (
      await Product.aggregate([
        {
          $match:{ _id:new mongoose.Types.ObjectId(`${productId}`)},
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: "$category",
        },
        {
          $unwind: "$brand",
        },
      ])
    )[0];
    
    const brand = await Brand.find({});
    const category = await Category.find({});
    if (!parentProduct){
      return res
       .status(404)
       .render('error.ejs',{ success: false, message: "product not found", user: req.user });
    }
    return res.status(200).render('admin/products/addVariant.ejs',({parentProduct, brand, category , user: req.user}))
  } catch (error) {
    console.error(error);
    return res
    .status(500)
    .render('error.ejs',{ success: false, message: "product not found" , user: req.user });
  }
}


// Save the new variant 
const saveVariantProduct = (async (req, res) => {
 try {
   const productId = generateUUID();
   const {
     name,
     offer,
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
     specifications,
    
   } = req.body;
   
   
   const parentId = req.params.parentId ;
 if(!parentId) res.status(400).json({success:false, message:'Parent product id is required '});
 
   const imagePath = req?.files.map((file) => {
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
 
   // save the product to the database
   const product = new Product({
     productId,
     name,
     offer,
     description,
     category,
     brand,
     regularPrice,
     sellingPrice,
     quantity,
     colors,
     status,
     specifications : JSON.parse(specifications),
     tags: JSON.parse(tags),
     sizes: size,
     productImageUrls: productImageUrls.map((image) => image.secure_url),
     createdBy: req?.user?._id,
     parentId: parentId,
     
   });
   const newVariant = await product.save();
 
   // update parent product's variants
  
  //  console.log( 'product id from user '+parentId);
   const parentProduct = await Product.findByIdAndUpdate(
     parentId,
     { $push: { variantId: newVariant._id } },
     { new: true }
   );
   console.log("variant product created successfully");
   console.log("product created successfully");
   res.status(200).send({ success:true,message:'product created successfully' });
 } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "server error" });
 }

})


export {
  createProduct,
  displayAddProducts,
  listProducts,
  deleteProduct,
  unblockProduct,
  blockProduct,
  displayEditProduct,
  saveEditedProduct,
  displayAddVariant,
  getTags,
  saveVariantProduct,
};
