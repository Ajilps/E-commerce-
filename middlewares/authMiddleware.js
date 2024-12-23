import {User} from '../models/userModel.js';
import jwt from 'jsonwebtoken';

export const verifyJWT  =( async (req, res, next) => {
    try {

        const token = req.cookies?.accessToken;
        console.log(`token : ${token}`); 
        if (!token) {
            return res.status(401).redirect('/user/login');
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken');
        if (!user) {
            return res.status(401).json({success: false, message: " invalid token"});
        }
        req.user = user;
        next();
    } catch (error) {
        console.log(`user authentication failed - ${error.message}`);
        res.status(401).json({success: false, message: "Unauthorized - Invalid token"});
    }
});

export const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
}