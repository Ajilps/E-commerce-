import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import { User } from "../models/userModel.js";

dotenv.config({
  path: "./.env",
});

const transporter = nodemailer.createTransport({
  service: "gmail",
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
function generateOtp() {
  // Declare a digits variable
  // which stores all digits
  let digits = "0123456789";
  let OTP = "";
  let len = digits.length;
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * len)];
  }
  return OTP;
}

const passSendOtp = async (req, res) => {
  if (req.session.passOtpValid === true || req.session.passOtpValid === null)
    return res.redirect("/user/login");
  // const email = req.body.email;
  const email = req.params.email;
  const username = req.session.username;

  console.log(`email from sent otp ${email} `);

  if (!email) {
    return res.status(404).redirect("/pageerror");
  }

  const otp = generateOtp();
  console.log(`otp from password reset ${otp}`);
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes

  console.log(otpStore[email]);
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });
    // res.status(200).send({ message: 'OTP sent successfully!' });
    // return true;
    return res.render("resetPass/passOtp.ejs", { email: email });
  } catch (error) {
    // res.status(500).send({ message: 'Error sending OTP.', error });
    console.log(error);
    res.redirect("/pageerror");
    return false;
  }
};

// reset the OTP
const resentOpt = async (req, res) => {
  const email = req.params.email;
  const username = req.session.username;

  console.log(`email from sent otp ${email} `);

  if (!email) {
    return res.status(404).redirect("/pageerror");
  }

  const otp = generateOtp();
  console.log(`resent Otp ${otp}`); // test
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });
    // res.status(200).send({ message: 'OTP sent successfully!' });
    // return true;
    return res.status(200).json({ success: true, message: "otp resent " });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP.", error });
    console.log(error);
    return false;
  }
};

const validateOtpForPassword = async (req, res) => {
  const otp = req.body.otp;
  const email = req.body.email;

  console.log(otp, email);
  console.log(otpStore[email]);
  console.log(otpStore[email]?.otp == otp);
  if (otpStore[email]?.otp == otp) {
    // if the otp is valid then create a session passOtpValid = true
    req.session.passOtpValid = true;
    req.session.email = email;
    // delete the otp from the store
    delete otpStore[email];
    // redirect to the reset password page
    return res
      .status(200)
      .json({ success: true, message: "verification successful" });
    // return res.render('resetPass/resetPass.ejs');
  }
  return res
    .status(404)
    .json({ success: false, message: "otp dose not match" });
};

//change password
const resetPassword = async (req, res) => {
  if (!req.session.passOtpValid === true)
    return res.status(400).json({ success: false, message: "session expired" });
  const email = req.body.email;
  const password = req.body.password;
  console.log(email);

  try {
    const user = await User.findOne({ email });
    console.log(user);
    user.password = password;
    await user.save({ validateBeforeSave: false });
    req.session.passOtpValid = null;
    return res
      .status(201)
      .json({ success: true, message: "password updated successfully " });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "password invalid  " });
  }
};

export { passSendOtp, validateOtpForPassword, resentOpt, resetPassword };
