import { Router } from "express";
import { verifyJWT, isAdmin } from "../middlewares/authMiddleware.js";
// import {} from '../controllers/admin/adminController.js'
import {
  customerInfo,
  customerBlock,
  customerUnBlock,
} from "../controllers/admin/customerController.js";
import {
  categoryInfo,
  addCategory,
  addOffer,
  removeOffer,
  unlistCategory,
  listCategory,
  editCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/admin/categoryController.js";
import {
  brandInfo,
  addBrand,
  updateBrand,
  editBrandDisplay,
  deleteBrand,
  listBrand,
  Un_listBrand,
  addBrandOffer,
  removeBrandOffer,
} from "../controllers/admin/brandController.js";
//multer
import multer from "multer";
// import {storage} from '../utils/multer.js';
import { uploads } from "../utils/multer.js";
// const upload = multer({storage: storage});
//end of multer

//product controllers
import {
  displayAddProducts,
  createProduct,
  listProducts,
  deleteProduct,
  unblockProduct,
  blockProduct,
  displayEditProduct,
  saveEditedProduct,
  getTags,
  displayAddVariant,
  saveVariantProduct,
} from "../controllers/admin/productController.js";

import {
  displayOrders,
  displayOrderDetails,
  changeOrderStatus,
} from "../controllers/admin/orderController.js";

import {
  displayCoupons,
  createCoupon,
  displayAddCouponForm,
  editCoupon,
  deleteCoupon,
} from "../controllers/admin/couponController.js";

import {displaySalesReport} from "../controllers/admin/report.js"

const router = Router();

//admin routes secured

router
  .get("/home", verifyJWT, isAdmin, (req, res) => {
    res.render("admin/adminView.ejs", { user: req.user });
  })
  .post("/home", verifyJWT, isAdmin, (req, res) => {
    res.render("admin/adminView.ejs");
  });

// customers
router.get("/customer", customerInfo);
router.get("/blockCustomer", customerBlock);
router.get("/unblockCustomer", customerUnBlock);

// category routes
router.get("/category", categoryInfo);
router.get("/category/addCategory", (req, res) => {
  res.render("admin/category/addCategory.ejs");
});

router.post("/category/addCategory", addCategory);
router.post("/category/addOffer", addOffer);
router.post("/category/removeOffer", removeOffer);
router.get("/category/unlistCategory", unlistCategory);
router.get("/category/listCategory", listCategory);
router.get("/category/editCategory", editCategory);
router.post("/category/updateCategory", updateCategory);
router.delete("/category/deleteCategory/:categoryId", deleteCategory);

//brand routes
router.get("/brand", brandInfo);
router.get("/brand/addBrand", (req, res) => {
  res.render("admin/brand/addBrand.ejs");
});
// add brand route
router.post("/brand/addBrand", uploads.single("brandImage"), addBrand);
// edit brand route
router.get("/brand/editBrand", editBrandDisplay);
router.post("/brand/editBrand", uploads.single("brandImage"), updateBrand);
// delete brand route
router.get("/brand/deleteBrand", deleteBrand);
// list and un_list brand
router.get("/brand/listBrand", listBrand);
// un_list brand
router.get("/brand/unlistBrand", Un_listBrand);
//add offer
router.post("/brand/addOffer", addBrandOffer);
//remove offer
router.post("/brand/removeOffer", removeBrandOffer);

//product routes
router.get("/products", listProducts);
router.get("/products/addProducts", displayAddProducts);

router.post("/products/addProducts", uploads.array("images", 5), createProduct);

//delete product
router.delete("/products/deleteProduct/:productId", deleteProduct);
//unblocking product
router.patch("/products/unblockProduct/:productId", unblockProduct);

//blocking product
router.patch("/products/blockProduct/:productId", blockProduct);

//editing product display
router.get("/products/editProduct/:productId", displayEditProduct);
// edit product getting tags
router.get("/products/editProduct/getTags/:productId", getTags);
// save edited product
router.post(
  "/products/editProducts/:productId",
  uploads.array("images", 5),
  saveEditedProduct
);
// Adding new variant for a product
router.get("/products/addVariant/:productId", displayAddVariant);

router.post(
  "/products/addVariant/:parentId",
  uploads.array("images", 5),
  saveVariantProduct
);

// orders
router.get("/orders", displayOrders);
router.get("/orders/:orderId", displayOrderDetails);
router.put("/orders/changeStatus/:orderId", changeOrderStatus);

// coupons
router.get("/coupons", displayCoupons);
router.get("/coupons/create", displayAddCouponForm);
router.post("/coupons/create", createCoupon);
router.get("/coupons/update/:couponId", displayAddCouponForm);
router.patch("/coupons/update/:couponId", editCoupon);
router.delete("/coupons/delete/:couponId", deleteCoupon);

// report 
router.get("/salesList", displaySalesReport)

export default router;
