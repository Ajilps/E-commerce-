import { Coupon } from "../../models/couponModel.js";
import { User } from "../../models/userModel.js";

const validateCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    // Check if the user has already redeemed the coupon
    const user = await User.findById(req.user._id).populate({
      path: "redeemedCoupon",
      select: "code", // Only populate the 'code' field of redeemed coupons
    });

    // Check if the coupon code is already in the user's redeemedCoupon array
    const hasRedeemed = user.redeemedCoupon.some(
      (coupon) => coupon.code === couponCode
    );

    if (hasRedeemed) {
      return res.status(400).json({
        success: false,
        message: "Coupon already redeemed by the user",
      });
    }

    const coupon = await Coupon.findOne({ code: couponCode });
    // check if the coupon exist or not
    if (!coupon) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon not found" });
    }
    // 2. Check validity
    if (!coupon.isValid()) {
      return res.status(400).json({ error: "Coupon is invalid or expired" });
    }

    return res.json({ success: true, message: "Coupon found", data: coupon });
  } catch (error) {
    console.error(`Error validating coupon: ${error.message}`);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export { validateCoupon };
