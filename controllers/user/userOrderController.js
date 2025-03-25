import { Order } from "../../models/orderModel.js";
import { Wishlist } from "../../models/wishlistModel.js";
import { Product } from "../../models/productModel.js";
import { Cart } from "../../models/cartModel.js";
import { User } from "../../models/userModel.js";
import { Wallet } from "../../models/walletModel.js";
import { Coupon } from "../../models/couponModel.js";
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
    const filter = {};
    filter.isActive = true;
    filter._id = { $nin: req.user.redeemedCoupon };
    filter.expiryDate = { $gt: new Date(new Date().setHours(0, 0, 0, 0)) };

    // get the coupons that the user can use
    const coupons = await Coupon.find(filter);

    return res.status(200).render("user/cart/checkout.ejs", {
      success: true,
      user: req.user,
      cart,
      coupons,
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
function roundPrice(price) {
  return Math.round(price * 100) / 100;
}

//create order and save the order and if the payment is online sent the payment details;
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
      if (!pro) {
        return res
          .status(400)
          .json({ success: false, message: "Product not found" });
      }
      if (pro.isBlocked) {
        return res
          .status(400)
          .json({ success: false, message: "Product is blocked" });
      }

      if (pro.quantity <= 0 || pro.quantity < product.quantity) {
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
        {
          $inc: { quantity: -product.quantity, sellingCount: product.quantity },
          // $inc: { sellingCount: product.quantity },
        },

        { new: true } // Return the updated document
      );
      console.log("updatedProduct : ", updatedProduct);
      console.log("product.quantity : ", product.quantity);
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
    }

    let shippingFee = 0;

    //create a expected delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 9);

    // getting the selected address from the user
    const shippingAddress = req.user.addresses.find(
      (addr) => addr._id == req.body.address.address
    );
    // console.log("shipping address from the user data : ", shippingAddress);
    // Create the order
    const orderData = {
      userId,
      products,
      totalPrice: req.body.total,
      subtotal: req.body.subTotal,
      tax: 0,
      discount: req.body.discount,
      shippingFee,
      coupon: req?.body?.coupon,
      shippingAddress: shippingAddress,
      billingAddress: shippingAddress,
      paymentMethod: req.body.paymentMethod,
      orderNotes: req.body?.notes,
      orderId: generateOrderId(),
      deliveryDate,
      couponDiscount: req.body?.couponDiscount,
    };
    // console.log("order data from place order : ", orderData);
    // if the payment is razor pay
    if (req.body.paymentMethod === "razorpay") {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const amount = req.body.total * 100; // amount in the smallest currency unit (paise)
      const orderDataRazorpay = {
        amount,
        currency: "INR",
        receipt: orderData.orderId,
        notes: {
          order_id: orderData.orderId,
        },
      };

      const response = await razorpay.orders.create(orderDataRazorpay);
      // console.log(response);
      orderData.razorpayOrderId = response.id;
      const order = new Order(orderData);
      let createdOrder = await order.save();
      await Cart.findOneAndDelete({ user: userId });
      // if coupon is there then add the coupon id to user redeemedCoupon
      if (req.body?.coupon) {
        let coupon = req?.body?.coupon;
        await Coupon.findOneAndUpdate(
          { code: coupon },
          { $inc: { usageCount: 1 } }
        );

        await User.findByIdAndUpdate(
          userId,
          { $push: { redeemedCoupon: req.body.coupon } },
          { new: true }
        );
        console.log("Coupon added to user");
      }

      return res
        .status(200)
        .json({ success: true, order, razorpayOrder: response });
    } else if (req.body.paymentMethod === "wallet") {
      // if the payment method is wallet then check the wallet balance and if the balance insufficient then
      // send a order failed response else reduce the balance from the wallet and save the order
      // send the success response
      try {
        const wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) {
          return res
            .status(400)
            .json({ success: false, message: "Wallet dose not exist !!" });
        }
        if (orderData.totalPrice > wallet.balance) {
          return res
            .status(400)
            .json({ success: false, message: "Insufficient Balance !!" });
        }
        // create order
        orderData.paymentStatus = "Paid";
        const order = new Order(orderData);
        const orderStatus = order.save();
        // if coupon is there then add the coupon id to user redeemedCoupon
        if (req.body?.coupon) {
          let coupon = req?.body?.coupon;
          await Coupon.findOneAndUpdate(
            { code: coupon },
            { $inc: { usageCount: 1 } }
          );

          await User.findByIdAndUpdate(
            userId,
            { $push: { redeemedCoupon: req.body.coupon } },
            { new: true }
          );
          console.log("Coupon added to user");
        }

        const payment = await Wallet.findOneAndUpdate(
          { user: req.user._id },
          {
            $inc: { balance: -Number(orderData.totalPrice) },
            $push: {
              transactions: {
                type: "Purchase",
                order: orderStatus._id,
                amount: orderData.totalPrice,
                status: "completed",
                description: "Product Purchase",
              },
            },
          },
          { new: true }
        );
        // console.log(wallet, payment);
        if (orderStatus && payment) {
          await Cart.findOneAndDelete({ user: userId });
          return res.status(200).json({
            success: true,
            message: "Order palaced and the payment done !",
          });
        }
        if (orderStatus) {
          await Cart.findOneAndDelete({ user: userId });
          return res.status(200).json({
            success: true,
            message: "Order palaced and the payment failed !",
          });
        }

        await Order.findByIdAndUpdate(orderStatus._id, {
          $set: { paymentStatus: "Pending" },
        });
        console.log("Wallet payment:");
        return res
          .status(400)
          .json({ success: false, message: "wallet payment failed !!!" });
      } catch (error) {
        return res
          .status(400)
          .json({ success: false, message: "wallet payment failed !!!" });
      }
    } else {
      console.log("inside else : COD ");
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
    console.log(error);
    console.error(`User order placement failed: ${error}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// confirming the payment
const confirmPayment = async (req, res) => {
  // console.log(req.body);
  try {
    const { razorpayOrderId, razorpaySignature, razorpayPaymentId } = req.body;
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId },
      { paymentStatus: "paid", razorpayPaymentId, paymentMethod: "razorpay" },
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

// render the order details page
const displayOrders = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const skip = (page - 1) * perPage;

    // Search and Filters
    // orderId , start date, end date
    const { search, startDate, endDate } = req.query;
    const query = { userId: req.user._id };

    // Search by Order ID (if needed, adjust based on your ID type)
    if (search) {
      query.orderId = { $regex: new RegExp(search, "i") };
    }

    // Date Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Fetch orders and count
    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .populate("products.productId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage),
      Order.countDocuments(query),
    ]);

    // Pagination calculations
    const totalPages = Math.ceil(totalOrders / perPage);

    res.render("user/orders/order.ejs", {
      orders,
      user: req.user,
      currentPage: page,
      totalPages,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
    });
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
    res.render("admin/orders/editOrder.ejs", { order, user: req.user });
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
      return res
        .status(404)
        .json({ status: false, message: "Order not found" });
    }
    if (
      order.status == "Shipped" ||
      order.status == "Delivered" ||
      order.status == "Delivered"
    ) {
      return res
        .status(400)
        .json({ status: false, message: "Order can't be cancelled" });
    }
    order.products.forEach(async (product) => {
      await Product.findByIdAndUpdate(
        product.productId,
        {
          $inc: { quantity: product.quantity, sellingCount: -product.quantity },
          // $inc: { sellingCount: -product.quantity },
        },
        { new: true }
      );
    });

    const orderUser = order.userId;
    let userWallet = await Wallet.findOne({ user: req.user._id });
    // console.log(userWallet);
    // testing
    if (!userWallet) {
      userWallet = await new Wallet({ user: orderUser }).save();
    }
    // console.log(orderUser, userWallet);

    order.status = "Cancelled";

    if (order.paymentStatus === "Paid") {
      order.paymentStatus = "Refunded";
      userWallet.balance += order.totalPrice;
      userWallet.transactions.push({
        type: "Deposit",
        order: order._id,
        amount: order.totalPrice,
        status: "completed",
        description: "product cancellation refund ",
      });
    } else {
      order.paymentStatus = "Cancelled";
    }
    // save the order and wallet
    await order.save();
    await userWallet.save();

    return res
      .status(204)
      .json({ success: true, message: "Order deleted successfully !!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

//get cart
const getCart = async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    return res.status(400).json({ success: false, message: "invalid user " });
  }
  try {
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.productId"
    );

    // console.log(cart);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "server error." });
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
  getCart,
};
