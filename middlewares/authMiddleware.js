import {User} from '../models/userModel.js';
import jwt from 'jsonwebtoken';

export const verifyJWT  =( async (req, res, next) => {
    try {

        const token = req.cookies?.accessToken || req.cookies?.token;
        // const gtoken = req.cookies?.token;
        console.log(`token from jwt : ${token}`); 
        if (!token ) {
                return res.status(401).redirect('/user/login');
        }
        console.log('befor jwt')
        const decodedToken =await jwt.verify(token, process.env.JWT_SECRET);
        console.log(`user from jwt  ${decodedToken?.email}`);
        const email = decodedToken.email;
        const user = await User.findOne({email}).select('-password -refreshToken');
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

export const isAdmin = (req, res, next) => {
    if (req.user?.role === 'admin') {
        next();
    } else {
        res.status(403).json({success: false, message: "Unauthorized - Admin only"});
    }
}