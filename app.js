import express from 'express';
import ejs from 'ejs';
import { User } from './models/userModel.js';
import path from 'node:path'
import cookieParser from 'cookie-parser';
import {noCache} from './middlewares/authMiddleware.js'


const app = express();

// app.use(express.cookieSession())
app.use(cookieParser());


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

// importing user routes
import userRoutes from './routes/userRoutes.js';

app.use('/user', userRoutes);
    

// importing admin routes
import adminRoutes from './routes/adminRoutes.js';
app.use('/admin', adminRoutes);



export {app};