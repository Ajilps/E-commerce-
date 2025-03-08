import { Coupon } from "../../models/couponModel.js";

// display all the coupons GET
const displayCoupons = async (req, res) => {
  const page = req.query.page || 1;
  const limit = 5;
  const search = req.query.search || "";
  const status = req.query.status || "";
  console.log(search, status);

  const filter = {};

  if (status <= 1 && status !== "") {
    filter.isActive = status == 1 ? true : false;
  }
  if (search !== "") {
    filter.code = { $regex: search, $options: "i" };
  }

  try {
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(limit * (page - 1))
      .limit(limit);

    const totalDocuments = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .countDocuments();

    console.log(coupons);
    return res.status(200).render("admin/coupon/coupons.ejs", {
      success: true,
      user: req.user,
      coupons,
      currentPage: page,
      totalPages: Math.ceil(totalDocuments / limit),
    });
  } catch (error) {
    console.error(`coupon retrieval failed - ${error.message}`);
    // return res.redirect("/admin/coupons");
  }
};

// searching and filtering

//display add coupon page GET
const displayAddCouponForm = async (req, res) => {
  try {
    const couponId = req?.params?.couponId;
    if (couponId) {
      let coupon = await Coupon.findById(couponId);
      let startDate = new Date(coupon.startDate);
      let expiryDate = new Date(coupon.expiryDate);

      // Format the date to YYYY-MM-DD
      const start = startDate.toISOString().split("T")[0];
      const expiry = expiryDate.toISOString().split("T")[0];
      console.log(coupon);
      // added the coupon edit page
      return res.status(200).render("admin/coupon/addCoupon.ejs", {
        success: true,
        user: req.user,
        coupon,
        start,
        expiry,
        cNew: true,
      });
    } else {
      return res.status(200).render("admin/coupon/addCoupon.ejs", {
        success: true,
        user: req.user,
        cNew: null,
        coupon: null,
      });
    }
  } catch (error) {}
};

// Create new coupon POST
const createCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      start,
      expiry,
      discountAmount,
      usageLimit,
      maximumDiscount,
      minimumPurchaseAmount,
    } = req.body;
    const coupon = new Coupon({
      code: couponCode,
      startDate: start,
      expiryDate: expiry,
      discountValue: discountAmount,
      discountType: "percentage",
      minPurchase: minimumPurchaseAmount,
      maxDiscount: maximumDiscount,
      usageLimit,
    });
    await coupon.save();
    return res
      .status(201)
      .json({ success: true, message: "coupon created successfully" });
  } catch (error) {
    console.error(`coupon creation failed - ${error.message}`);
    return res.status(400).json({ success: false, message: error.message });
  }
};

//edit the coupon PATCH
const editCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      start,
      expiry,
      discountAmount,
      usageLimit,
      maximumDiscount,
      minimumPurchaseAmount,
    } = req.body;
    const couponId = req.params.couponId;

    // Validate input data
    if (!couponCode || !start || !expiry || discountAmount === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Parse dates if they are strings
    const startDate = new Date(start);
    const expiryDate = new Date(expiry);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(expiryDate.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    // Prepare update data
    const data = {
      code: couponCode,
      startDate: startDate,
      expiryDate: expiryDate,
      discountValue: discountAmount,
      minPurchase: minimumPurchaseAmount,
      maxDiscount: maximumDiscount,
      usageLimit,
      // Do not hardcode discountType; retrieve it from the existing coupon or pass it in the request
    };
    console.log(data);

    const couponnew = await Coupon.findById(couponId);
    console.log(couponnew);

    // Update the coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      {
        startDate: startDate,
        expiryDate: expiryDate,
        discountValue: discountAmount,
        code: couponCode,
        minPurchase: minimumPurchaseAmount,
        maxDiscount: maximumDiscount,
        usageLimit,
      },
      { new: true }
    );

    console.log(updatedCoupon);
    if (!updatedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (error) {
    console.error(`Coupon update failed - ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.couponId);
    return res
      .status(200)
      .json({ success: true, message: "Coupon deleted successfully !" });
  } catch (error) {
    console.error(`coupon deletion failed - ${error.message}`);
  }
};

// disable/ enable coupon on demand PATCH
const statusChange = async (req, res) => {
  try {
    const couponId = req.body?.couponId;
    const status = req.body?.status;
    console.log(req.body);
    if (!couponId)
      return res
        .status(403)
        .json({ success: false, message: "Invalid coupon Id " });

    const result = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: status },
      { new: true }
    );
    console.log(result);
    return res.status(200).json({
      success: true,
      message: `The coupon status updated to ${
        status == true ? "Enabled" : " Disabled"
      }`,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "server Error !!!" });
  }
};

export {
  displayCoupons,
  createCoupon,
  editCoupon,
  deleteCoupon,
  displayAddCouponForm,
  statusChange,
};
