import { User } from "../../models/userModel.js";
import { Product } from "../../models/productModel.js";
import { Order } from "../../models/orderModel.js";
import { Wishlist } from "../../models/wishlistModel.js";
import mongoose from "mongoose";
import statusCode from "../../utils/statusCodes.js";

const displayWishlist = async (req, res) => {
  try {
    const user = req.user;
    let wishlistProducts = await Wishlist.findOne({
      user: user._id,
    }).populate("products.productId");

    // If the wishlist doesn't exist, create one
    if (!wishlistProducts) {
      wishlistProducts = await Wishlist.create({
        user: user._id,
        products: [],
      });
    }

    // console.log(wishlistProducts);
    return res.status(statusCode.SUCCESS).render("user/wishlist/wishlist.ejs", {
      success: true,
      user: req.user,
      wishlistProducts,
    });
  } catch (error) {
    console.error(`Failed to display wishlist - ${error.message}`);
    return res.status(statusCode.SERVER_ERROR).redirect("/pageerror");
  }
};

const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = req.user;

    if (!productId) {
      return res
        .status(statusCode.UPDATE_FAILED)
        .json({ success: false, message: "Product ID required" });
    }

    // Find the user's wishlist
    let wishlist = await Wishlist.findOne({ user: user._id });

    // If the wishlist doesn't exist, create one
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: user._id, products: [] });
    }

    // Check if the product is already in the wishlist
    const productExists = wishlist.products.some((product) =>
      product.productId.equals(productId)
    );
    if (productExists) {
      return res
        .status(statusCode.UPDATE_FAILED)
        .json({ success: false, message: "Product already in wishlist" });
    }

    // Add the product to the wishlist
    await Wishlist.findOneAndUpdate(
      { user: user._id },
      { $push: { products: { productId: productId, addedOn: Date.now() } } },
      { new: true }
    );

    return res
      .status(statusCode.SUCCESS)
      .json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    console.error(`Failed to add product to wishlist - ${error.message}`);
    return res
      .status(statusCode.SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = req.user;
    if (!productId) {
      return res
        .status(statusCode.INVALID_REQUEST)
        .json({ success: false, message: "Product ID required" });
    }
    // Find the user's wishlist and remove the product
    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { user: user._id }, // Find the wishlist by user ID
      {
        $pull: {
          products: { productId: new mongoose.Types.ObjectId(`${productId}`) },
        },
      }, // Remove the product
      { new: true } // Return the updated document
    );
    if (!updatedWishlist) {
      return res
        .status(statusCode.UPDATE_FAILED)
        .json({ success: false, message: "Wishlist not found" });
    }
    
    return res.status(statusCode.SUCCESSFULLY_DELETED).json({
      success: true,
      message: "Product removed from wishlist",
      data: updatedWishlist,
    });
  } catch (error) {
    console.error(`Failed to remove product from wishlist - ${error.message}`);
    return res
      .status(statusCode.UPDATE_FAILED)
      .json({ success: false, message: "Update Failed" });
  }
};

export { displayWishlist, addToWishlist, removeFromWishlist };
