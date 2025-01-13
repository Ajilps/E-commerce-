import {Category} from '../../models/categoryModel.js'
import {Product} from '../../models/productModel.js'
import {Brand} from '../../models/brandModel.js'

// no product editing functions 

//display all products for lon logged in user

const displayAllProducts =( async (req,res)=>{
    const products = await Product.aggregate([{
        $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category"
        }
    },
    {
        $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand"
        }
    },{
        $unwind:'$category'        
    },{
        $unwind:'$brand'
    }

]);
    res.render("index.ejs", ({ products }));
})


// display product for logged in user
const displayProductUser =( async (req,res)=>{
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    res.render("user/product/product.ejs", ({product, user:req.user}));
})
//display User Home page list display 

const displayUserHome =( async (req,res)=>{
    const products = await Product.aggregate([{
        $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category"
        }
    },
    {
        $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand"
        }
    },{
        $unwind:'$category'        
    },{
        $unwind:'$brand'
    }

]);

    res.render("user/userHome.ejs", ({ user:req.user, products }));
})

export {displayProductUser, displayUserHome, displayAllProducts}



