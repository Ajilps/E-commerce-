import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { generateRefCode } from "../utils/refCode.js";
import { Strategy as FacebookStrategy } from "passport-facebook";

const router = express.Router();

// Initialize Passport.js
router.use(passport.initialize());
router.use(passport.session());

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRECT,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_API_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRECT,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "emails"], // Request profile fields
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, profile);
    }
  )
);

// Serialize and Deserialize User
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

//facebook routes
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  async (req, res) => {
    // Generate JWT
    try {
      const payload = {
        id: req.user.id,
        displayName: req.user.displayName,
        email: req.user.emails ? req.user.emails[0].value : null, // Facebook may not always return an email
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
        algorithm: "HS256",
      });

      const fbId = req.user?.id;
      const email = req?.user?.emails[0].value;
      console.log(email);
      let userExists;
      if (!email) {
        userExists = await User.findOne({ fbId });
      } else {
        userExists = await User.findOne({ email });
      }
      console.log(!userExists);
      if (!userExists) {
        const email = req.user.emails[0].value;
        const username = req.user.displayName;
        console.log(`facebook id ${fbId}`);

        const refCode = generateRefCode(username);
        // the  user not in the database create a account
        const user = await User.create({
          username: username,
          email: email,
          fbId: fbId,
          isBlocked: false,
          referralCode: refCode,
        });
      }
      // Store token in cookies and redirect
      res.cookie("token", token, { httpOnly: true });
      res.redirect("/user/home");
    } catch (error) {
      console.log(error);
      return res.status(400).redirect("/pageerror");
    }
  }
);

//google routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    // Generate JWT
    const payload = {
      id: req.user.id,
      displayName: req.user.displayName,
      email: req.user.emails[0].value,
    };
    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
      algorithm: "HS256",
    });

    // check if the user exists or not
    const email = req.user.emails[0].value;
    const username = req.user.displayName;
    const googleId = req.user.id;
    const userExists = await User.findOne({ email });
    console.log(!userExists);
    if (!userExists) {
      const refCode = generateRefCode(username);
      // the  user not in the database create a account
      const user = await User.create({
        username: username,
        email: email,
        googleId: googleId,
        isBlocked: false,
        referralCode: refCode,
      });
    }
    // Store the token in a cookie or pass it to the EJS template

    res.cookie("token", token, { httpOnly: true });
    res.redirect("/user/home");
  }
);

export default router;
