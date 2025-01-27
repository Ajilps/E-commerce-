import {User} from '../../models/userModel.js';
import {Product} from '../../models/productModel.js';
import {Order} from '../../models/orderModel.js';
import {Wishlist} from '../../models/wishlistModel.js'

const displayWishlist = async (req, res) => {
    try {
        const user = req.user;
        const wishlistProducts = await Product.find({ _id: { $in: user.wishList } });
        return res.status(200).render('user/wishlist.ejs', { success: true, user: req.user, wishlistProducts });
        
    } catch (error) {
        console.error(`Failed to display wishlist - ${error.message}`);
    }
}

const addToWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;
        const user = req.user;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID required" });
        }
        if (user.wishList.includes(productId)) {
            return res.status(400).json({ success: false, message: "Product already in wishlist" });
        }
        await User.findByIdAndUpdate(user._id, { $push: { wishList: productId } });
        return res.status(200).json({ success: true, message: "Product added to wishlist" });
    } catch (error) {
        console.error(`Failed to add product to wishlist - ${error.message}`);
    }
}

const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;
        const user = req.user;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID required" });
        }
        if (!user.wishList.includes(productId)) {
            return res.status(400).json({ success: false, message: "Product not in wishlist" });
        }
        await User.findByIdAndUpdate(user._id, { $pull: { wishList: productId } });
        return res.status(200).json({ success: true, message: "Product removed from wishlist" });
    } catch (error) {
        console.error(`Failed to remove product from wishlist - ${error.message}`);
    }
}

const displayCompare = async (req, res) => {
    try {
        const user = req.user;
        const compareProducts = await Product.find({ _id: { $in: user.compareList } });
        return res.status(200).render('user/compare.ejs', { success: true, user: req.user, compareProducts });
    } catch (error) {
        console.error(`Failed to display compare products - ${error.message}`);
    }
}

const addToCompare = async (req, res) => {
    try {
        const productId = req.params.productId;
        const user = req.user;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID required" });
        }
        if (user.compareList.includes(productId)) {
            return res.status(400).json({ success: false, message: "Product already in compare list" });
        }
        await User.findByIdAndUpdate(user._id, { $push: { compareList: productId } });
        return res.status(200).json({ success: true, message: "Product added to compare list" });
    } catch (error) {
        console.error(`Failed to add product to compare list - ${error.message}`);
    }
}

const removeFromCompare = async (req, res) => {
    try {
        const productId = req.params.productId;
        const user = req.user;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID required" });
        }
        if (!user.compareList.includes(productId)) {
            return res.status(400).json({ success: false, message: "Product not in compare list" });
        }
        await User.findByIdAndUpdate(user._id, { $pull: { compareList: productId } });
        return res.status(200).json({ success: true, message: "Product removed from compare list" });
    } catch (error) {
        console.error(`Failed to remove product from compare list - ${error.message}`);
    }
}

export  {
    displayWishlist,
    addToWishlist,
    removeFromWishlist,
    displayCompare,
    addToCompare,
    removeFromCompare,
};