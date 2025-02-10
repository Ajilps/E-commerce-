import express from "express";
import {
  isBlocked,
  isLoggedIn,
  sentOtp,
  verifyOpt,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  changePassword,
  refreshAccessToken,
  getCurrentUserDetails,
  getCurrentUserShippingDetails,
  displayChangePassword,
  showShippingAddressForm,
  updateCurrentUserDetails,
  changePasswordWithOldPss,
  addNewShippingAddress,
  editShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultAddress,
} from "../controllers/userController.js";

// import { displayWishlist } from "../controllers/user/wishlistController.js"; //wishlist controller

import {
  displayCart,
  addToCart,
  removeFromCart,
  updateCart,
} from "../controllers/user/cartController.js"; //cart controller

import {
   displayWallet,
   getWalletBalance,
   } from "../controllers/user/walletController.js";  //wallet

import {
  displayCheckout,
  placeOrder,
  displayOrders,
  displayOrdersDetails,
  cancelOrder,
  confirmPayment,
  getCart,
} from "../controllers/user/userOrderController.js"; //checkout controller

// retry update
import { retryPayment, verifyPayment } from "../controllers/user/paymentController.js";

import { verifyJWT } from "../middlewares/authMiddleware.js";

import { validateCoupon } from "../controllers/user/userCoupon.js"; // importing validate coupon from user coupon validation
//importing user side product controllers
import {
  displayProductUser,
  displayUserHome,
  displayStore,
} from "../controllers/user/productController.js";
// import {sentOtp,verifyOpt,resentOpt} from '../controllers/verifyEmail.js'
//reset password
import {
  passSendOtp,
  resentOpt,
  resetPassword,
  validateOtpForPassword,
} from "../controllers/verifyEmail.js";

//wishlist
import {
  displayWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/user/wishlistController.js";

const router = express.Router();

router
  .get("/register", isLoggedIn, (req, res) => {
    res.render("register.ejs");
  })
  .post("/register", registerUser);

//email verification route

router.get("/verify-email/:email", sentOtp);
// router.get('/resentOtp/:email',resentOpt)
router.post("/verify-email/", verifyOpt);

router.get("/forgotPassword", (req, res) => {
  res.render("resetPass/emailValidation.ejs");
});

router.get("/verifyPassEmail/:email", passSendOtp);
// resent otp
router.get("/resentOtp/:email", resentOpt);
// verify otp
router.post("/verifyPassEmail", validateOtpForPassword);

router.get("/resetPass/:email", (req, res) => {
  if (req.session.passOtpValid === true) {
    const email = req.params.email;
    console.log(email); // testing
    if (!email) return res.send({ success: false, message: "email required" });

    return res.status(200).render("resetPass/resetPass.ejs", { email: email });
  }
  return res.status(401).redirect("/user/forgotPassword");
});

// password reset route end
router.post("/resetPassword", resetPassword);

router.get("/login", isLoggedIn, (req, res) => {
  console.log("rendering login page");
  res.render("login.ejs");
});

router.post("/login", isBlocked, loginUser);

// ==================//secured routes

//=========== protected product route =============//
router.use(verifyJWT); // verifying all the requests

router.get("/logout", logoutUser);
router.post("/changePassword", changePassword);
router.post("/refreshAccessToken", refreshAccessToken);
router.get("/me", getCurrentUser);
router.get("/accountDetails", getCurrentUserDetails);
router.patch("/updateProfile", updateCurrentUserDetails); // update user details
router.get("/shippingAddress", getCurrentUserShippingDetails);
router.get("/shippingAddress/addAddress", showShippingAddressForm); // adding new address
router.post("/shippingAddress/addAddress", addNewShippingAddress); // adding new address post
router.get("/shippingAddress/editAddress/:addressId", editShippingAddress); //show edit address
router.patch("/shippingAddress/editAddress/:addressId", updateShippingAddress); // edit address
router.get("/shippingAddress/setDefault/:addressId", setDefaultAddress); // edit address
router.delete(
  "/shippingAddress/deleteAddress/:addressId",
  deleteShippingAddress
); // delete address
router.get("/accountDetails/changePassword/:userId", displayChangePassword);
router.post("/accountDetails/changePassword/:userId", changePasswordWithOldPss);

router.get("/", displayUserHome);
router.get("/home", displayUserHome);
router.get("/product/:productId", displayProductUser);
router.get("/store", displayStore); //store route
router.get("/wishlist", displayWishlist); //wishlist route
//cart
router.get("/cart", displayCart);
router.post("/cart/add/:productId", addToCart);
router.put("/cart/update/:productId", updateCart); // update cart item quantity
router.delete("/cart/remove/:productId", removeFromCart); // remove item from cart

router.get("/cart/checkout", displayCheckout);
//checking the coupon is valid or not
router.post("/coupon/validateCoupon", validateCoupon);

router.get("/orders", displayOrders);
router.get("/orders/orderDetails/:orderId", displayOrdersDetails);
router.post("/order/placeOrder", placeOrder);
router.patch("/orders/cancel/:orderId", cancelOrder);
router.post("/orders/confirm-payment", confirmPayment);
router.get("/orders/getart",getCart);
//retry payment
router.post("/orders/retryPayment",retryPayment);
router.post("/orders/verifyPayment",verifyPayment);

//wishlist
router.get("/wishlist", displayWishlist);
router.post("/wishlist/add/:productId", addToWishlist);
router.delete("/wishlist/remove/:productId", removeFromWishlist);

//Wallet
router.get("/wallet", displayWallet);
router.get("/wallet/balance", getWalletBalance);


export default router;
