// import express from 'express';
import {User} from '../models/userModel.js';
import jwt from 'jsonwebtoken';
// import mongoose, { trusted } from 'mongoose';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        
        const user = await User.findById(userId);
        
        // console.log(`token generation userId : ${user}`); // testing print statement
        
        const accessToken = await user.generateAuthToken();
        const refreshToken = await user.generateRefreshToken();


        user.refreshToken = refreshToken;
    //    const saveusr =  await user.save({validateBeforeSave: false});
    //    console.log(`token generation : ${saveusr}`); // testing print statement
        return {accessToken, refreshToken};
    } catch (error) {
        console.error(`(user controllers )token generation failed - ${error.message}`);
    }
};

const registerUser = async (req, res) => {

    try {
        const {username, email, password} = req.body;
        // console.log(email)
        // checking the values are present or not 
        if([username, email, password].some((field)=>field?.trim() === '')){
            return res.status(400).json({success: false, message: "Invalid request"});
        }

        // checking the user is already exist or not
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({success: false, message: "User already exists"});
        }

        // creating the user and save the user 
        const user = await User.create({
            username,
            email,
            password,
            createdBy: req.user?._id 
        })
        const createdUser = await User.findById(user._id).select('-password -refreshToken');
        // checking the user is created or not
        if(!createdUser){
            return res.status(400).json({success: false, message: "user creation failed - user not found"});
        }
        return res.status(201).json({success: true, message: "user created"});
        // return res.status(201).json({success: true, message: "user created"});

    } catch (error) {
        console.log(`user creation failed - ${error.message}`);
    }
}

const loginUser = async (req, res) =>{
    try {
        const {email, password} = req.body;
        // console.log(`login email : ${email}`);

        if(!email || !password){
            return res.status(400).json({success: false, message: "Invalid request"});
        }

        const user = await User.findOne({email});

        //
        // checking the user is present or not
        if(!user){
            return res.status(400).json({success: false, message: "Invalid credentials"});
        }
        
        
        const isPasswordValid = await user.isPasswordMatch(password);
        
        
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
        console.log(`user : ${user?.role}`);// testing print statement
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

export {registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser};