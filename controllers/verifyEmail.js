// import nodemailer from 'nodemailer'
// import crypto from 'crypto'
// import dotenv from 'dotenv';

// dotenv.config({
//     path:'./.env'
// });

// const transporter = nodemailer.createTransport({
//     service:'gmail',
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//     },
// });

// // Store OTPs temporarily in memory (use a database in production)
// const otpStore = {};

// // Generate OTP
// const generateOtp = () => crypto.randomInt(1000, 9999).toString();
// const resentOpt =(async (req,res)=>{
//     const email = req.params.email;
//     const username = req.session.username;

//     console.log(`email from sent otp ${email} , ${username}`);
    
//     if (!email) return({ message: 'Email is required.' });

//         const otp = generateOtp();
//         otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes
    
//         try {
//             await transporter.sendMail({
//                 from: process.env.EMAIL_USER,
//                 to: email,
//                 subject: 'Your OTP Code',
//                 text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
//             });
//             // res.status(200).send({ message: 'OTP sent successfully!' });
//             // return true;
//             return res.status(200).send('otp resent ');
//         } catch (error) {
//             res.status(500).send({ message: 'Error sending OTP.', error });
//             console.log(error)
//             return false
//         }
// })

// const sentOtp=(async (req,res)=>{
//     // const email = req.body.email;
//     const email = req.params.email;
//     const username = req.session.username;

//     console.log(`email from sent otp ${email} , ${username}`);
    
//     if (!email) return({ message: 'Email is required.' });

//         const otp = generateOtp();
//         otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes
    
//         try {
//             await transporter.sendMail({
//                 from: process.env.EMAIL_USER,
//                 to: email,
//                 subject: 'Your OTP Code',
//                 text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
//             });
//             // res.status(200).send({ message: 'OTP sent successfully!' });
//             // return true;
//             return res.render('otp.ejs',{email:email});
//         } catch (error) {
//             // res.status(500).send({ message: 'Error sending OTP.', error });
//             console.log(error)
//             return false
//         }
// });

// const verifyOpt =( async (req,res)=>{
//     const otp = req.body.otp;
//     const email = req.body.email;
//     const username = req.session.username;
//     console.log(otp , email, username);
//     if(otpStore[email] === otp){
//         return res.status(200).send({message:'verification successful'})
//     }
//     return res.status(404).send({message:'otp dose not match'});
// });


// // export {sentOtp,verifyOpt, resentOpt }