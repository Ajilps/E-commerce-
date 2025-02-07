import express from "express";
import { User } from "../../models/userModel.js";

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get users with filtering
 * @access Private (Admin only)
 */

// display the sales report page
const displaySalesReport = async (req, res) => {
  return res.status(200).render("admin/report/salesReport3.ejs");
};

//filtering request

const filterData = async (req, res) => {
  const filter = req.body;
};

router.get("/", async (req, res) => {
  try {
    const { search, role, status, country, page = 1, limit = 10 } = req.query;

    // Build filter query
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Role filter
    if (role && role !== "all") {
      query.role = role;
    }

    // Status filter
    if (status && status !== "all") {
      query.isBlocked = status === "blocked";
    }

    // Country filter
    if (country && country !== "all") {
      query["addresses.country"] = country;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(query)
      .select("username email role isBlocked addresses redeemedCount")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
        perPage: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route GET /api/users/report
 * @desc Generate user report
 * @access Private (Admin only)
 */
router.get("/report", async (req, res) => {
  try {
    const { search, role, status, country } = req.query;

    // Build filter query (same as above)
    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (status && status !== "all") {
      query.isBlocked = status === "blocked";
    }

    if (country && country !== "all") {
      query["addresses.country"] = country;
    }

    // Get all filtered users for report
    const users = await User.find(query)
      .select(
        "username email role isBlocked addresses redeemedCount orders wallet"
      )
      .populate("orders", "totalAmount status")
      .populate("wallet", "balance")
      .lean();

    // Transform data for CSV
    const reportData = users.map((user) => ({
      Username: user.username,
      Email: user.email,
      Role: user.role,
      Status: user.isBlocked ? "Blocked" : "Active",
      "Primary Location": user.addresses[0]?.country || "N/A",
      "Redeemed Count": user.redeemedCount,
      "Total Orders": user.orders?.length || 0,
      "Wallet Balance": user.wallet?.balance || 0,
      "Registration Date": user.createdAt,
    }));

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=user-report.csv"
    );

    // Send CSV header
    res.write(Object.keys(reportData[0]).join(",") + "\n");

    // Send each row
    reportData.forEach((row) => {
      res.write(Object.values(row).join(",") + "\n");
    });

    res.end();
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route GET /api/users/stats
 * @desc Get user statistics
 * @access Private (Admin only)
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: "count" }],
          roleDistribution: [
            {
              $group: {
                _id: "$role",
                count: { $sum: 1 },
              },
            },
          ],
          blockedUsers: [
            {
              $match: { isBlocked: true },
            },
            { $count: "count" },
          ],
          countryDistribution: [
            {
              $unwind: "$addresses",
            },
            {
              $group: {
                _id: "$addresses.country",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    res.json(stats[0]);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route GET /api/users/search-suggestions
 * @desc Get search suggestions for countries and other filters
 * @access Private (Admin only)
 */
router.get("/search-suggestions", async (req, res) => {
  try {
    const countries = await User.distinct("addresses.country");

    res.json({
      countries,
      roles: ["user", "admin"],
      statuses: ["active", "blocked"],
    });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export { displaySalesReport };

// import Order from "../models/Order.js";
// import mongoose from "mongoose";

// Utility function to build date range queries
const buildDateRangeQuery = (startDate, endDate, fieldName) => {
  const dateQuery = {};
  if (startDate) dateQuery.$gte = new Date(startDate);
  if (endDate) dateQuery.$lte = new Date(endDate);
  return Object.keys(dateQuery).length ? dateQuery : null;
};

// Main filter function with multiple filtering capabilities
const filterOrders = async (filterParams) => {
  const {
    userId,
    status,
    paymentStatus,
    orderId,
    trackingNumber,
    productId,
    createdStart,
    createdEnd,
    updatedStart,
    updatedEnd,
    deliveryStart,
    deliveryEnd,
    minTotal,
    maxTotal,
    page = 1,
    limit = 10,
    sortBy = "-createdAt",
  } = filterParams;

  const query = {};

  // User and basic filters
  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (orderId) query.orderId = orderId;
  if (trackingNumber) query.trackingNumber = trackingNumber;

  // Date range filters
  const createdAtQuery = buildDateRangeQuery(createdStart, createdEnd);
  if (createdAtQuery) query.createdAt = createdAtQuery;

  const updatedAtQuery = buildDateRangeQuery(updatedStart, updatedEnd);
  if (updatedAtQuery) query.updatedAt = updatedAtQuery;

  const deliveryDateQuery = buildDateRangeQuery(deliveryStart, deliveryEnd);
  if (deliveryDateQuery) query.deliveryDate = deliveryDateQuery;

  // Price range filter
  if (minTotal || maxTotal) {
    query.totalPrice = {};
    if (minTotal) query.totalPrice.$gte = Number(minTotal);
    if (maxTotal) query.totalPrice.$lte = Number(maxTotal);
  }

  // Product filter
  if (productId) {
    query.products = {
      $elemMatch: {
        productId: new mongoose.Types.ObjectId(productId),
      },
    };
  }

  // Execute query with pagination
  const options = {
    skip: (page - 1) * limit,
    limit: Number(limit),
    sort: sortBy,
  };

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("userId", "name email")
      .populate("products.productId", "name price")
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    success: true,
    count: orders.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: orders,
  };
};

// Specific filter examples

// 1. Get orders by user
const getOrdersByUser = async (userId, page = 1, limit = 10) => {
  return filterOrders({
    userId,
    page,
    limit,
    sortBy: "-createdAt",
  });
};

// 2. Get orders by status
const getOrdersByStatus = async (status, page = 1, limit = 10) => {
  return filterOrders({
    status,
    page,
    limit,
    sortBy: "-createdAt",
  });
};

// 3. Get orders by payment status
const getOrdersByPaymentStatus = async (
  paymentStatus,
  page = 1,
  limit = 10
) => {
  return filterOrders({
    paymentStatus,
    page,
    limit,
    sortBy: "-createdAt",
  });
};

// 4. Get orders containing specific product
const getOrdersWithProduct = async (productId, page = 1, limit = 10) => {
  return filterOrders({
    productId,
    page,
    limit,
    sortBy: "-createdAt",
  });
};

// 5. Get orders within date range
const getOrdersByDateRange = async (
  startDate,
  endDate,
  page = 1,
  limit = 10
) => {
  return filterOrders({
    createdStart: startDate,
    createdEnd: endDate,
    page,
    limit,
    sortBy: "createdAt",
  });
};

export {
  filterOrders,
  getOrdersByUser,
  getOrdersByStatus,
  getOrdersByPaymentStatus,
  getOrdersWithProduct,
  getOrdersByDateRange,
};
