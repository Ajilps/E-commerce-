// import express from 'express';
import {User} from '../models/userModel.js';
import jwt from 'jsonwebtoken';
// import mongoose, { trusted } from 'mongoose';
import session from 'express-session'
import {generateRefCode} from '../utils/refCode.js'

//email otp
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({
    path:'./.env'
});

let userData = {};

// creating a transporter for nodemailer
const transporter = nodemailer.createTransport({
    service:'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
// Store OTPs temporarily in memory (use a database in production)
const otpStore = {};
// Generate OTP
const generateOtp = () => crypto.randomInt(1000, 9999).toString();


// check whether the user is already exists or not if not sent a success message 
const registerUser = (async (req,res)=>{
    const {username, email, password} = req.body ;

    try {
        // checking the values are present or not 
        if ([username, email, password].some((field) => field?.trim() === '')) {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }
    
        // checking the user is already exist or not
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
    
        userData = req.body;
        console.log(`data saved at register ${userData.username}`);// testing 
    
        return res.status(201).json({success: true, message: "user can verify email"});
    } catch (error) {
        console.log(`error in registration ${error}`)
        return res.status(500).send({message:'server error during user check'});

    }
});



// after getting the success message the client will call this rout with a parameter email. then this function will generate a otp and save it 
// then render the otp verification page with the email 
const sentOtp =(async (req,res)=>{
    const email = req.params.email;

    if (!email) return({ message: 'Email is required.' });

        const otp = generateOtp();
        otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes
        console.log(otp) // test 
        try {
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
            });
            // res.status(200).send({ message: 'OTP sent successfully!' });
            // return true;
            return res.render('otp.ejs',{email:email});
        } catch (error) {
            // res.status(500).send({ message: 'Error sending OTP.', error });
            console.log(error)
            return false
        }

});

// Next verify the otp with the res otp and also check the email 
const verifyOpt = (async (req,res)=>{
        const {otp, email }= req.body ;

        // testing the print
        const username = String(userData.username);
        const password = String(userData.password)

        console.log(`user info from verification ${typeof(email)} , ${password}`);
        console.log(otpStore[email]);

        if ( !email || !otp ) return res.status(400).send({ message: 'Email and OTP are required.' });

        //getting the otp form the saved object
        const storedOtp =otpStore[email];

        if (!storedOtp) return res.status(400).send({ message: 'No OTP found for this email.' });

        // res.send({message:'success'});

    if (storedOtp.otp === otp) {
        if (Date.now() > storedOtp.expiresAt) {
            return res.status(400).send({ message: 'OTP has expired.' });
        }
        delete otpStore[email]; // Remove OTP after successful verification

        //creating referral code
        const refCode = generateRefCode(username);
        console.log(refCode);

        // if the opt validation is successful then save the user data to database 
        // creating the user and save the user 

        const user = await User.create({
            username,
            email,
            password,
            isBlocked:false,
            referralCode:refCode,

        })
        const createdUser = await User.findById(user._id).select('-password -refreshToken');
        // console.log(createdUser);// test 
        // // checking the user is created or not
        if(!createdUser){
            return res.status(400).json({success: false, message: "user creation failed - user not found"});
        }

        return res.status(201).send( {success: true, message: 'OTP verified successfully! and user created' });
    } else {
        return res.status(400).send({ message: 'Invalid OTP.' });
    }
})















const generateAccessAndRefreshToken = async (userId) => {
    try {
        
        const user = await User.findById(userId);
        
        // console.log(`token generation userId : ${user}`); // testing print statement
        
        const accessToken = await user.generateAuthToken();
        const refreshToken = await user.generateRefreshToken();

        // console.log(accessToken) //tes debug

        user.refreshToken = refreshToken;
    //    const saveusr =  await user.save({validateBeforeSave: false});
    //    console.log(`token generation : ${saveusr}`); // testing print statement
        return {accessToken, refreshToken};
    } catch (error) {
        console.error(`(user controllers )token generation failed - ${error.message}`);
    }
};







const loginUser = async (req, res) =>{
    try {
        const {email, password} = req.body;
        // console.log(`login email : ${email}`);

        if(!email || !password){
            return res.status(400).json({success: false, message: "Invalid request"});
        }

        const user = await User.findOne({email});
        // console.log(`user from log in ${user}`)// debug testing

        //
        // checking the user is present or not
        if(!user){
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }
        
        
        const isPasswordValid = await user.isPasswordMatch(password);
        // console.log(isPasswordValid)// debug
        
        if(!isPasswordValid){
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }
        
        
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
        
        // console.log(`user tokens  : ${JSON.stringify( accessToken)}, ${refreshToken}`); // testing print statement

        const options = {
            // expires: 24*60*60*1000, // 1 day
            httpOnly: true,
            secure: true
        };
        console.log(`user from login : ${user?.role}`);// testing print statement
        // if(user.role === 'admin'){
        //     return res
        //     .status(200)
        //     .cookie('accessToken', accessToken, options)
        //     .cookie('refreshToken', refreshToken, options)
        //     .render('admin/adminView.ejs',{success: true, message: "Login success Full", user: user?.role});
        // }
        return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json({success: true, message: "Login success Full", user: user?.role});


    } catch (error) {
        console.error(`user login failed - ${error.message}`);
    }
}


// log out user

const logoutUser = async (req, res) => {
    try{
        await User.findByIdAndUpdate(req.user._id, {refreshToken: ''},{new: true});

        const options = {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
            secure: true
        };
        return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .render('login.ejs',{success: true, message: "Logged out successfully"});

    } catch (error){
        console.error(`user logout failed - ${error.message}`);
    }

}


// creating the refresh token
const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken;
        if(!incomingRefreshToken){
            return res.status(401).json({success: false, message: "Unauthorized - No token provided"});
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken?._id);

        if(!user){
            return res.status(401).json({success: false, message: "Unauthorized - Invalid token"});
        }   
        if(incomingRefreshToken !== user.refreshToken){
            return res.status(401).json({success: false, message: "Unauthorized - Invalid token"});
        }
        const options={
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: true
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

        return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .render('userView.ejs',{success: true, message: "Token refreshed successfully", user: user});
    } catch (error) {
        console.error(`user token refresh failed - ${error.message}`);
    }
}

const changePassword = async (req, res) => {
    try {
        const {oldPassword, newPassword} = req.body;
        if(!oldPassword || !newPassword){
            return res.status(400).json({success: false, message: "Invalid request"});
        }
        const user = await User.findById(req.user._id);
        const isOldPasswordValid = await user.isPasswordMatch(oldPassword);
        if(!isOldPasswordValid){
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }
        user.password = newPassword;
        await user.save({validateBeforeSave: false});
        return res.status(200).json({success: true, message: "Password changed successfully"});
    } catch (error) {
        console.error(`user password change failed - ${error.message}`);
    }
}

//get current user

const getCurrentUser = async (req, res) => {
    try {
        return res.status(200).json({success: true, user: req.user});

    }   catch (error) {
        console.error(`user retrieval failed - ${error.message}`);
    }
}





export {verifyOpt, sentOtp ,registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser,userData};