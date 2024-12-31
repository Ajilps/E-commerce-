import {Router} from 'express'
import {verifyJWT,isAdmin} from '../middlewares/authMiddleware.js'
import {} from '../controllers/admin/adminController.js'
import {customerInfo, customerBlock, customerUnBlock} from '../controllers/admin/customerController.js'
const router = Router();


//admin routes secured

router.get('/home',verifyJWT, isAdmin, (req, res) => {
    res.render('admin/adminView.ejs',{user: req.user});
}).post('/home',verifyJWT, isAdmin, (req, res) => {
    res.render('admin/adminView.ejs')
});

router.get('/products',(req,res)=>{
    res.render('admin/products.ejs')
})
router.get('/customer',customerInfo)

router.get('/blockCustomer',customerBlock)
router.get('/unblockCustomer',customerUnBlock)

export default router;