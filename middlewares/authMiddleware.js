import {User} from '../models/userModel.js';
import jwt from 'jsonwebtoken';

export const verifyJWT  = ( async (req, res, next) => {
    try {

        const token = req.cookies?.accessToken || req.cookies?.token;
        // console.log(`token from jwt : ${token}`); 
        if (!token ) {
                return res.status(401).redirect('/user/login');
        }
        console.log('before jwt') // test

        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
        console.log(`user from jwt  ${decodedToken?.email}`); // logging the user 
        const email = decodedToken.email;
        const user = await User.findOne({email}).select('-password -refreshToken');
        if (!user) {
            return res.status(401).redirect('/admin/login');
        }
        if(user.isBlocked){
            console.log("user blocked")
            return res.status(403)
            .clearCookie('accessToken')
            .clearCookie('refreshToken')
            .render('userBlocked.ejs',({message:'This user is blocked by the admin. Please contact the admin for farther details ', user:user}));
        }
        req.user = user;
        next();
    } catch (error) {
        req.session.jwtTokenExpired =  true ;
        console.log(`user authentication failed error catch - ${error}`);
       return res.status(401)
        .clearCookie('accessToken')
        .clearCookie('refreshToken')
        .redirect('/user/login?message=Token expired');
    }
});



export const isAdmin = (req, res, next) => {
    try{
        if (req.user?.role === 'admin') {
            next();
        } else {
            res.status(403).redirect("/admin/login");
        }

    } catch(err){
        console.log(`server error from is admin check ${err}`);
}
}