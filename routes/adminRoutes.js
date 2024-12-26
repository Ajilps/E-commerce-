import {Router} from 'express'
import {verifyJWT,isAdmin} from '../middlewares/authMiddleware.js'


const router = Router();


//admin routes secured

router.get('/home',verifyJWT, isAdmin, (req, res) => {
    res.render('admin/adminView.ejs',{user: req.user});
}).post('/home',verifyJWT, isAdmin, (req, res) => {
    res.render('admin/adminView.ejs')
});



export default router;