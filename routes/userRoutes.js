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
} from "../controllers/userController.js";

import { verifyJWT } from "../middlewares/authMiddleware.js";

//importing user side product controllers 
import {displayProductUser, displayUserHome} from '../controllers/user/productController.js'
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

router.get('/verifyPassEmail/:email', passSendOtp,);
// verify otp 
router.post('/verifyPassEmail', validateOtpForPassword);

router.get('/resetPass/:email', (req, res) => {
    const email = req.params.email;
    console.log(email)// testing
    if (!email) return res.send({ success: false, message: 'email required' })

    res.status(200).render('resetPass/resetPass.ejs', { email: email })
});
router.post('/resetPassword', resetPassword)

// password reset route end 



router.get('/login', isLoggedIn, (req, res) => {

    res.render('login.ejs')
});

router.post('/login',isBlocked, loginUser);

// ==================//secured routes

router.get('/', verifyJWT, displayUserHome )
// router.get('/', verifyJWT, (req, res) => {
//     console.log(req.user);
//     res.render('user/userHome.ejs', { user: req?.user });
// });

router.get('/logout', verifyJWT, logoutUser);
router.get('/me', verifyJWT, getCurrentUser);
router.post('/changePassword', verifyJWT, changePassword);
router.post('/refreshAccessToken', refreshAccessToken);

//===========non protected product route =============//

router.get('/product/:productId',verifyJWT,displayProductUser)



export default router;