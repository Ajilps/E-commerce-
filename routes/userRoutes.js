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
  displayWallet,
  displayCart,
  displayCheckout,
} from "../controllers/userController.js";

import { verifyJWT } from "../middlewares/authMiddleware.js";

//importing user side product controllers 
import {displayProductUser, displayUserHome, displayStore} from '../controllers/user/productController.js'
// import {sentOtp,verifyOpt,resentOpt} from '../controllers/verifyEmail.js'

const router = express.Router();


router.get('/register',isLoggedIn, (req, res) => {
    res.render('register.ejs')
}).post('/register', registerUser);

//email verification route

router.get('/verify-email/:email', sentOtp)
// router.get('/resentOtp/:email',resentOpt)
router.post('/verify-email/', verifyOpt)


//reset password
import { passSendOtp, resetPassword, validateOtpForPassword } from '../controllers/verifyEmail.js'
router.get('/forgotPassword', (req, res) => {

    res.render('resetPass/emailValidation.ejs')
})

router.get('/verifyPassEmail/:email', passSendOtp);
// verify otp 
router.post('/verifyPassEmail', validateOtpForPassword);

router.get('/resetPass/:email', (req, res) => {
    if(req.session.passOtpValid === true){
        const email = req.params.email;
        console.log(email)// testing
        if (!email) return res.send({ success: false, message: 'email required' })
    
       return res.status(200).render('resetPass/resetPass.ejs', { email: email })
    } 
    return res.status(401).redirect('/user/forgotPassword')
});

// password reset route end 
router.post('/resetPassword', resetPassword)

router.get('/login', isLoggedIn, (req, res) => {
    console.log('rendering login page')
    res.render('login.ejs')
});

router.post('/login',isBlocked, loginUser);

// ==================//secured routes

//=========== protected product route =============//
router.use(verifyJWT); // verifying all the requests 

router.get('/logout',  logoutUser);
router.post('/changePassword',  changePassword);
router.post('/refreshAccessToken', refreshAccessToken);
router.get('/me',  getCurrentUser);
router.get('/accountDetails',  getCurrentUserDetails);
router.get('/shippingAddress',  getCurrentUserShippingDetails);
router.get('/shippingAddress/addAddress',  showShippingAddressForm);
router.get('/accountDetails/changePassword',  displayChangePassword);
router.get('/wallet',  displayWallet);
router.get('/cart', displayCart);
router.get('/cart/checkout',  displayCheckout);
router.get('/',  displayUserHome )
router.get('/home',  displayUserHome )
router.get('/product/:productId',displayProductUser)

//store route
router.get('/store',displayStore)

export default router;