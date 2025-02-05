import { Order } from "../../models/orderModel.js";
import { Wishlist } from "../../models/wishlistModel.js";
import { Product } from "../../models/productModel.js";
import { Cart } from "../../models/cartModel.js";
import { User } from "../../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
// display displayCheckout (get)
const displayCheckout = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.productId"
    );
    if (!cart) {
      return res.status(404).redirect("/user/cart");
    }

    return res.status(200).render("user/cart/checkout.ejs", {
      success: true,
      user: req.user,
      cart,
    });
  } catch (error) {
    console.error(`user checkout display failed - ${error.message}`);
  }
};
function generateOrderId() {
  const timestamp = Date.now().toString().slice(-6); // Use last 6 digits of timestamp
  const randomNum = Math.floor(Math.random() * 100); // Random number between 0 and 99
  return `ORD-${timestamp}-${randomNum}`;
}

const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    // testing
    // console.log(req.body);

    // Fetch the user's cart and populate product details
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.productId"
    );

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    // Check if there are any products in the cart with insufficient stock
    for (const product of cart.products) {
      // console.log(product.productId.quantity);
      let pro = await Product.findById(product.productId._id);
      if (pro.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.productId.name} has insufficient stock`,
        });
      }
    }

    let products = [];
    let subtotal = 0;
    let totalRegularPrice = 0;

    // Process each product in the cart
    for (const product of cart.products) {
      // Update product stock
      const updatedProduct = await Product.findByIdAndUpdate(
        product.productId._id,
        { $inc: { quantity: -product.quantity } },
        { new: true } // Return the updated document
      );

      if (!updatedProduct) {
        throw new Error(`Product ${product.productId._id} not found`);
      }

      // console.log(`Product after stock update: ${updatedProduct}`);

      // Add product details to the order
      products.push({
        productId: product.productId._id,
        quantity: product.quantity,
        price: product.productId.sellingPrice,
      });

      // Calculate total price
      subtotal += Math.ceil(product.productId.sellingPrice * product.quantity);
      // Calculate total totalSellingPrice
      totalRegularPrice += Math.ceil(
        product.productId.regularPrice * product.quantity
      );
    }

    // Add 18% tax to the total price
    let tax = Math.ceil(subtotal * 0.18);
    let totalPrice = Math.ceil(subtotal * 0.18 + subtotal);
    let shippingFee = 0;
    let discount = totalRegularPrice - subtotal;
    // if(coupon){
    //   discount = coupon.discount;
    //   totalPrice = totalPrice - (totalPrice * (coupon.discount / 100));
    //   shippingFee = 10;
    // }
    // Create the order

    const orderData = {
      userId,
      products,
      totalPrice,
      subtotal,
      tax,
      discount,
      shippingFee,
      shippingAddress: req.body.address,
      billingAddress: req.body.address,
      paymentMethod: req.body.paymentMethod,
      orderNotes: req.body?.notes,
      orderId: generateOrderId(),
    };

    // if the payment is razor pay
    if (req.body.paymentMethod === "razorpay") {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const amount = totalPrice * 100; // amount in the smallest currency unit (paise)
      const orderDataRazorpay = {
        amount,
        currency: "INR",
        receipt: orderData.orderId,
        notes: {
          order_id: orderData.orderId,
        },
      };

      const response = await razorpay.orders.create(orderDataRazorpay);
      console.log(response);
      orderData.razorpayOrderId = response.id;
      const order = new Order(orderData);
      let createdOrder = await order.save();
      await Cart.findOneAndDelete({ user: userId });
      // if coupon is there then add the coupon id to user redeemedCoupon
      if (req.body?.coupon) {
        const user = await User.findByIdAndUpdate(
          userId,
          { $push: { redeemedCoupon: req.body.coupon } },
          { new: true }
        );
        console.log("Coupon added to user");
      }

      return res
        .status(200)
        .json({ success: true, order, razorpayOrder: response });
    } else {
      console.log("inside else ");
      const order = new Order(orderData);
      await order.save();
      // if coupon is there then add the coupon id to user redeemedCoupon
      if (req.body.coupon) {
        const user = await User.findByIdAndUpdate(
          userId,
          { $push: { redeemedCoupon: req.body.coupon } },
          { new: true }
        );
        console.log("Coupon added to user");
      }
      await Cart.findOneAndDelete({ user: userId });

      return res.status(200).json({ success: true, order: orderData });
    }
  } catch (error) {
    console.error(`User order placement failed: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// confirming the payment
const confirmPayment = async (req, res) => {
  console.log(req.body);
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
    await Cart.findOneAndDelete({ user: order.userId });

    return res
      .status(200)
      .json({ success: true, message: "Payment confirmed" });
  } catch (error) {
    console.error(`Payment confirmation failed: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

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

// render the order details page
const displayOrders = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("products.productId")
      .sort({ createdAt: -1 });
    // console.log(orders);
    res.render("user/orders/order.ejs", { orders, user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// display order details
const displayOrdersDetails = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId).populate("products.productId");
    if (!order) {
      return res.status(404).send("Order not found");
    }
    res.render("user/orders/orderDetails.ejs", { order, user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// render the order edit page
const editOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId)
      .populate("products.product")
      .populate("user");

    if (!order) {
      return res.status(404).send("Order not found");
    }
    res.render("admin/orders/editOrder.ejs", { order });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// update the order status

const updateOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.status(200).send(order);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
//delete the order
// render the order delete page
const cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  // add the item to stock is pending
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send("Order not found");
    }
    order.products.forEach(async (product) => {
      await Product.findByIdAndUpdate(
        product.productId,
        { $inc: { quantity: product.quantity } },
        { new: true }
      );
    });

    // await Order.findByIdAndDelete(orderId);
    await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: "Cancelled" },
      { new: true }
    );
    return res
      .status(204)
      .json({ success: true, message: "Order deleted successfully !!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

export {
  displayCheckout,
  displayOrders,
  editOrder,
  updateOrderStatus,
  cancelOrder,
  placeOrder,
  displayOrdersDetails,
  confirmPayment,
};
