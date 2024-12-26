import express from "express";
import {registerUser,loginUser,logoutUser,getCurrentUser,changePassword,refreshAccessToken} from "../controllers/userController.js";
import {verifyJWT} from "../middlewares/authMiddleware.js";

const router = express.Router();


router.get('/register', (req, res) => {
    res.render('register.ejs')
}).post('/register',registerUser);

router.get('/login', (req, res) => {
    res.render('login.ejs')
});

router.post('/login', loginUser);
        
//secured routes
router.get('/home',verifyJWT,(req,res)=>{
    console.log(req.user);
    res.render('userView.ejs',{user: req.user.username});});
        
router.get('/logout',verifyJWT,logoutUser);
router.get('/me',verifyJWT,getCurrentUser);
router.post('/changePassword',verifyJWT,changePassword);
router.post('/refreshAccessToken',refreshAccessToken);

export default router;