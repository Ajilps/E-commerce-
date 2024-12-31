import nodemailer from 'nodemailer'
import crypto from 'crypto'
import dotenv from 'dotenv';
import {User} from '../models/userModel.js';

dotenv.config({
    path:'./.env'
});

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
const generateOtp = () => crypto.randomInt(10000, 999999).toString();
const resentOpt =(async (req,res)=>{
    const email = req.params.email;
    const username = req.session.username;

    console.log(`email from sent otp ${email} , ${username}`);
    
    if (!email) return({ message: 'Email is required.' });

        const otp = generateOtp();
        otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes
    
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
            });
            // res.status(200).send({ message: 'OTP sent successfully!' });
            // return true;
            return res.status(200).send('otp resent ');
        } catch (error) {
            res.status(500).send({ message: 'Error sending OTP.', error });
            console.log(error)
            return false
        }
})

const passSendOtp=(async (req,res)=>{
    // const email = req.body.email;
    const email = req.params.email;
    const username = req.session.username;

    console.log(`email from sent otp ${email} , ${username}`);
    
    if (!email) return({ message: 'Email is required.' });

        const otp = generateOtp();
        console.log(`otp from password reset ${otp}`);
        otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes
    
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
            });
            // res.status(200).send({ message: 'OTP sent successfully!' });
            // return true;
            return res.render('resetPass/passOtp.ejs',{email:email});
        } catch (error) {
            // res.status(500).send({ message: 'Error sending OTP.', error });
            console.log(error)
            return false
        }
});

const validateOtpForPassword = ( async (req,res)=>{
    const otp = req.body.otp;
    const email = req.body.email;
    
    console.log(otp , email);
    console.log(otpStore[email]?.otp == otp);
    if(otpStore[email]?.otp == otp){
        return res.status(200).send({ success:true, message:'verification successful'})
        // return res.render('resetPass/resetPass.ejs');
    }
    return res.status(404).send({success:false, message:'otp dose not match'});
});


//change password 
const resetPassword = async (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    console.log(email);

    try {
        const user = await User.findOne({email})
        console.log(user)
        user.password = password;
        await user.save({validateBeforeSave:false});
       return res.status(201).json({success:true, message:'password updated successfully '});
    
    } catch (error) {
        console.log(error)
       return res.status(400).json({success:false, message:'password invalid  '}) 
    }

}

export { passSendOtp, validateOtpForPassword, resentOpt, resetPassword }