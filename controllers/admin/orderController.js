import { Order } from "../../models/orderModel.js";
import { User } from "../../models/userModel.js";
import { Product } from "../../models/productModel.js";
import { get } from "mongoose";
import { Wallet } from "../../models/walletModel.js";
import { formatCurrency } from "../../utils/currency.js";

const displayOrders = async (req, res) => {
  try {
    // Extract pagination parameters from the query string
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 orders per page if not provided
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    // Extract status filter from the query string
    const status = req.query.status;

    // Create a filter object based on the status
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Fetch orders with pagination and filtering
    const orders = await Order.find(filter)
      .populate("products")
      .populate("userId", "-password")
      .skip(skip) // Skip documents for pagination
      .limit(limit)
      .sort({ createdAt: -1 }); // Limit the number of documents per page

    // Get the total number of orders for pagination calculation
    const totalOrders = await Order.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);

    // Render the EJS template with pagination data
    return res.status(200).render("admin/orders/orders.ejs", {
      success: true,
      user: req.user,
      orders,
      pagination: {
        page,
        limit,
        totalPages,
        totalOrders,
      },
      statusFilter: status, // Pass the current status filter to the template
    });
  } catch (error) {
    console.error(`User orders retrieval failed - ${error.message}`);
    return res.status(500).render("error.ejs", {
      message: "Failed to retrieve orders. Please try again later.",
    });
  }
};

// display order details (get)

const displayOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("products.productId")
      .populate("userId");

    if (!order) {
      return res.status(404).redirect("/pageerror");
    }
    return res.status(200).render("admin/orders/orderDetails.ejs", {
      success: true,
      user: req.user,
      order,
    });
  } catch (error) {
    console.error(`order details retrieval failed - ${error.message}`);
  }
};

// update order status (post)

const updateOrderStatus = async (req, res) => {
  try {
    // const order = await Order.findByIdAndUpdate(req.params.orderId, { status: req.body.status }, { new: true });
    return res.status(200).render("admin/orders/order_details.ejs", {
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error(`order status update failed - ${error.message}`);
  }
};

// display order status update form (get)

const displayUpdateOrderStatusForm = async (req, res) => {
  try {
    // const order = await Order.findById(req.params.orderId);
    return res.status(200).render("admin/orders/update_status.ejs", {
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error(
      `order status update form retrieval failed - ${error.message}`
    );
  }
};

// change order status (put)
const changeOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;
    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }
    if (status === "Rejected") {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send("Order not found");
      }
      order.products.forEach(async (product) => {
        await Product.findByIdAndUpdate(
          product.productId,
          {
            $inc: {
              quantity: product.quantity,
              sellingCount: -product.quantity,
            },
          },
          { new: true }
        );
      });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      user: req.user,
      order,
      message: ` Order status changed to  ${status} successfully ! `,
    });
  } catch (error) {
    console.error(`order rejection failed - ${error.message}`);
    return res.status(500).json({ success: false, message: "server error " });
  }
};

//display the return requests to the admin
const displayReturnReq = async (req, res) => {
  console.log("oreders");
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 orders per page if not provided
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    // Extract status filter from the query string
    const status = req?.query?.status || "Return Pending";

    // Create a filter object based on the status
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (req.query?.status == "Return Rejected") {
      delete filter.status;
      filter.retReject = true;
    }
    console.log(filter);
    // Fetch orders with pagination and filtering
    const orders = await Order.find(filter)
      .populate("products")
      .populate("userId", "-password")
      .skip(skip) // Skip documents for pagination
      .limit(limit)
      .sort({ createdAt: -1 }); // Limit the number of documents per page

    // Get the total number of orders for pagination calculation
    const totalOrders = await Order.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);
    if (!orders) {
      return res
        .status(404)
        .render("admin/returns/return.ejs", { user: req.user });
    }
    return res.status(200).render("admin/returns/return.ejs", {
      user: req.user,
      orders: orders,
      pagination: {
        page,
        limit,
        totalPages,
        totalOrders,
      },
      statusFilter: status,
    });
    res.send("success");
  } catch (error) {
    console.log("error from return request :", error);
  }
};
//accept return request
const displayReturnDetails = async (req, res) => {
  try {
    const order = await Order.findById(req?.params?.orderId)
      .populate("products.productId")
      .populate("userId");
    if (!order) {
      return res.status(404).redirect("/pageerror");
    }
    return res
      .status(200)
      .render("admin/returns/returnDetails.ejs", { order, user: req.user });
  } catch (error) {
    console.log(error);
    return res.status(404).redirect("/pageerror");
  }
};

//reject or accept return request
const updateStatus = async (req, res) => {
  // get the data
  const { action, orderId } = req?.body;
  if (!action.trim() || !orderId.trim()) {
    return res.status(400).json({
      success: false,
      message: "invalid request action and orderId is needed ",
    });
  }
  console.log(action, orderId);
  // check the action type
  if (action === "approve") {
    const status = "Return Approved";
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res
          .status(404)
          .json({ status: false, message: "Order not found " });
      }
      order.products.forEach(async (product) => {
        await Product.findByIdAndUpdate(
          product.productId,
          {
            $inc: {
              quantity: product.quantity,
              sellingCount: -product.quantity,
            },
          },
          { new: true }
        );
      });

      const orderUser = order.userId;
      console.log(`order user: ${orderUser}`);
      let userWallet = await Wallet.findOne({ user: orderUser });
      console.log(userWallet);
      // testing
      if (!userWallet) {
        userWallet = await new Wallet({ user: orderUser }).save();
      }
      console.log(orderUser, userWallet);

      order.status = status;

      if (order.paymentStatus === "Paid") {
        order.paymentStatus = "Refunded";

        userWallet.balance = formatCurrency(
          order.totalPrice + userWallet.balance
        );
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
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + 5);
      order.returnDate = returnDate;

      // save the order and wallet
      await order.save();
      await userWallet.save();

      console.log("response was success from order return approved success : ");
      return res.status(200).json({
        success: true,
        message: "Order Return Approved successfully !!",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  } else {
    try {
      // update the order by rejecting the return request
      const order = await Order.findByIdAndUpdate(orderId, {
        $set: { status: "Delivered", retReject: true },
      });

      //  = await Order.findById(orderId);
      if (!order) {
        return res
          .status(404)
          .json({ status: false, message: "Order not found" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Order Return rejected successfully" });
    } catch (error) {
      return res
        .status(404)
        .json({ status: false, message: "Order not found" });
    }
  }

  // revert the product stock count and if coupon is applied then remove the coupon from user and reduce the coupon used count

  // if the action is to approve then if the payment status is paid then refund it to wallet
};

// export functions

export {
  displayOrders,
  displayOrderDetails,
  updateOrderStatus,
  changeOrderStatus,
  displayUpdateOrderStatusForm,
  displayReturnReq,
  displayReturnDetails,
  updateStatus,
};
