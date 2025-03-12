import express from "express";
import ejs from "ejs";
import { User } from "./models/userModel.js";
import path from "node:path";
import session from "express-session";
// import {noCache} from './middlewares/authMiddleware.js'
import cors from "cors";
import nocache from "nocache";
import helmet from "helmet";

// importing admin routes
import adminRoutes from "./routes/adminRoutes.js";
import cookieParser from "cookie-parser";
import {
  verifyJWT,
  isAdmin,
  isLoggedInUser,
} from "./middlewares/authMiddleware.js";

// importing user routes
import userRoutes from "./routes/userRoutes.js";

// importing google auth route
import googleAuth from "./routes/auth.js";

// importing user side product controllers for lon logged in users
import { displayAllProducts } from "./controllers/user/productController.js";

// creating app
const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 72 * 60 * 60 * 1000 },
  })
);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE,PATCH",
    credentials: true,
  })
);

app.use(cookieParser()); // don't remove
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.resolve("views"));

app.use(express.static(path.resolve("public")));

// Apply nocache middleware globally
app.use(nocache());
// app.use(helmet())
//landing page
app.get("/", displayAllProducts);

// testing the put data middleware

//dev testing
app.use((req, res, next) => {
  console.log("\x1b[35m" + `Request Path: ${req.url}` + "\x1b[0m");
  console.log("\x1b[36m" + `Request method: ${req.method}` + "\x1b[0m");
  next();
});

app.get("/pageerror", (req, res) => {
  res.render("error.ejs");
});

app.get("/forgotpass", (req, res) => {
  res.render("forgotPass.ejs");
});
app.get("/resetpass", (req, res) => {
  res.render("resetPass.ejs");
});
app.get("/passotp", (req, res) => {
  res.render("passOtp.ejs");
});

//using google auth route

app.use("/auth", googleAuth);

app.use("/user", userRoutes);

app.get("/admin/login", (req, res) => {
  res.render("admin/adminLogin.ejs");
});
// Admin routes (secured)
app.use("/admin", verifyJWT, isAdmin, adminRoutes);

// import { generateChartData } from "./controllers/admin/adminController.js";
// app.post("/diagram", generateChartData);

app.use("*", (req, res) => {
  return res.status(404).render("error.ejs");
});

export { app };
