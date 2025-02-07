import { Order } from "../../models/orderModel.js";
import crypto from "crypto";
import Razorpay from "razorpay";

// retry payment
const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Payment already confirmed" });
    }

    if (order.paymentAttempts >= 3) {
      return res
        .status(400)
        .json({ success: false, message: "Maximum payment attempts reached" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = order.totalPrice * 100; // amount in the smallest currency unit (paise)
    const orderDataRazorpay = {
      amount,
      currency: "INR",
      receipt: order.orderId,
      notes: {
        order_id: order.orderId,
      },
    };

    console.log("Razorpay Order Data for Retry:", orderDataRazorpay);

    const response = await razorpay.orders.create(orderDataRazorpay);
    console.log("Razorpay Response for Retry:", response);

    order.razorpayOrderId = response.id;
    order.paymentAttempts += 1;
    await order.save();

    return res
      .status(200)
      .json({ success: true, order: order, razorpayOrder: response });
  } catch (error) {
    console.error(`Retry payment failed: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//verify payment
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpaySignature, razorpayPaymentId } = req.body;
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId },
      { paymentStatus: "paid", razorpayPaymentId },
      { new: true }
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    order.paymentStatus = "Paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;

    await order.save();

    return res
      .status(200)
      .json({ success: true, message: "Payment confirmed" });
  } catch (error) {
    console.error(`Payment confirmation failed: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { retryPayment, verifyPayment };
