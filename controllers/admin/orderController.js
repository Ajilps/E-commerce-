import { Order } from "../../models/orderModel.js";
import { User } from "../../models/userModel.js";
import { Product } from "../../models/productModel.js";

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
    const order = await Order.findById(req.params.orderId).populate(
      "products.productId"
    );
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
          { $inc: { quantity: product.quantity } },
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

// export functions

export {
  displayOrders,
  displayOrderDetails,
  updateOrderStatus,
  changeOrderStatus,
  displayUpdateOrderStatusForm,
};
