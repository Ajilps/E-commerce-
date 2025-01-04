import {Router} from 'express'
import {verifyJWT,isAdmin} from '../middlewares/authMiddleware.js'
// import {} from '../controllers/admin/adminController.js'
import {customerInfo, customerBlock, customerUnBlock} from '../controllers/admin/customerController.js'
import {categoryInfo, addCategory, addOffer, removeOffer, unlistCategory, listCategory, editCategory, updateCategory} from '../controllers/admin/categoryController.js'
import {brandInfo,addBrand, updateBrand, editBrandDisplay} from '../controllers/admin/brandController.js'
//multer
import multer from'multer';
// import {storage} from '../utils/multer.js';
import { uploads } from '../utils/multer.js'
// const upload = multer({storage: storage});
//end of multer


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


router.get('/category',categoryInfo)
router.get('/category/addCategory',(req,res)=>{
    res.render('admin/addCategory.ejs')
})

router.post('/category/addCategory',addCategory)
router.post('/category/addOffer',addOffer)
router.post('/category/removeOffer',removeOffer)
router.get('/category/unlistCategory',unlistCategory)
router.get('/category/listCategory',listCategory)
router.get('/category/editCategory',editCategory)
router.post('/category/updateCategory',updateCategory)

//brand routes
router.get('/brand',brandInfo)
router.get('/brand/addBrand',(req,res)=>{
    res.render('admin/addBrand.ejs')
})
// add brand route
router.post('/brand/addBrand',uploads.single("brandImage"),addBrand)
// edit brand route
router.get('/brand/editBrand',editBrandDisplay)
// router.get('/brand/editBrand',uploads.single("brandImage"),updateBrand)



export default router;