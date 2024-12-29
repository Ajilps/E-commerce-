import express from "express";
import { sentOtp, verifyOpt, registerUser, loginUser, logoutUser, getCurrentUser, changePassword, refreshAccessToken } from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
// import {sentOtp,verifyOpt,resentOpt} from '../controllers/verifyEmail.js'

const router = express.Router();


router.get('/register', (req, res) => {
    res.render('register.ejs')
}).post('/register', registerUser);

//email verification route

router.get('/verify-email/:email', sentOtp)
// router.get('/resentOtp/:email',resentOpt)
router.post('/verify-email/', verifyOpt)



router.get('/login', (req, res) => {
    res.render('login.ejs')
});

router.post('/login', loginUser);

//secured routes
router.get('/home', verifyJWT, (req, res) => {
    console.log(req.user);
    res.render('user/userView.ejs', { user: req.user.username });
});

router.get('/logout', verifyJWT, logoutUser);
router.get('/me', verifyJWT, getCurrentUser);
router.post('/changePassword', verifyJWT, changePassword);
router.post('/refreshAccessToken', refreshAccessToken);



export default router;