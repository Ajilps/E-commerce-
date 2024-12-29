import express from 'express';
import ejs from 'ejs';
import { User } from './models/userModel.js';
import path from 'node:path'
import session from 'express-session'
import {noCache} from './middlewares/authMiddleware.js'
import cors from 'cors';


// importing user routes
import userRoutes from './routes/userRoutes.js';

// importing google auth route
import googleAuth from './routes/auth.js'

const app = express();

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge:72*60*60*1000},
}))



app.use(cors({
  origin:'http://localhost:3000',
  methods:'GET,POST,PUT,DELETE',
  credentials:true
}))

app.use(cookieParser())// don't remove 
app.use(express.json());
app.set('view engine', 'ejs')
app.set('views',path.resolve('views'));

app.use(express.static(path.resolve('public')));
app.use(express.urlencoded({extended:true}));
app.use(noCache);



//landing page
app.get('/',(req,res)=>{
    res.render('index.ejs');
});


//using google auth route

app.use('/auth',googleAuth)

app.use('/user', userRoutes);
    

// importing admin routes
import adminRoutes from './routes/adminRoutes.js';
import cookieParser from 'cookie-parser';
app.use('/admin', adminRoutes);



export {app};