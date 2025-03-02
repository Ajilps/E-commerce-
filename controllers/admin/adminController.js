import { Product } from "../../models/productModel.js";
import { Order } from "../../models/orderModel.js";
import { User } from "../../models/userModel.js";
import moment from "moment";
import { Brand } from "../../models/brandModel.js";
import { Query } from "mongoose";

//function for getting the chart data
//total Sales
// total Orders
/* total discounts
filter for day , week , month, custom 
most selling product (3)

 */

// get the filter form the admin or set the filter to default
// const data = {};
// const filter = {};

//   // data must have /*
//   // starting date ending date if no date take all the data til now
//   // category most selling category
//   // brand most selling brand
//   //  */

// Helper function to get date filter based on parameters
const getDateFilter = (reportType, startDate, endDate, quickDate, created) => {
  let dateFilter = {};

  quickDate = quickDate == undefined ? Date.now() : quickDate;
  const field = created === "created" ? "createdAt" : "updatedAt";

  // Validate input parameters
  if (reportType === "custom") {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start) && !isNaN(end)) {
        dateFilter[field] = { $gte: start, $lte: end };
      }
    }
  } else {
    // For non-custom reports, use quickDate with a preset range.
    const validReportTypes = ["daily", "weekly", "monthly", "yearly"];
    if (validReportTypes.includes(reportType) && quickDate) {
      const selectedDate = moment(quickDate);
      if (selectedDate.isValid()) {
        const ranges = {
          daily: "day",
          weekly: "week",
          monthly: "month",
          yearly: "year",
        };
        const range = ranges[reportType];

        dateFilter[field] = {
          $gte: selectedDate.clone().startOf(range).toDate(),
          $lte: selectedDate.clone().endOf(range).toDate(),
        };
      }
    }
  }

  return dateFilter;
};

async function mostSellingPro(dateFilter) {
  // most selling 4 products [{name: , count: , stock:  },{},{}...]
  try {
    const products = await Product.find(dateFilter)
      .sort({ sellingCount: -1 })
      .limit(5)
      .select({ name: 1, sellingCount: 1, quantity: 1 });
    // console.log(products);

    return products;
  } catch (error) {
    console.log(error);
  }
}

async function filteredProducts(dateFilter) {
  // return a array of top 5 Brands [{},{},]
  dateFilter.paymentStatus = {
    $in: ["Paid", "Pending"],
    $nin: ["Cancelled", "Refunded"],
  };
  try {
    const data = await Order.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "pro",
        },
      },
      {
        $unwind: "$pro",
      },
      {
        $set: {
          "pro.oldPrice": "$products.price",
          "pro.Query": "$products.quantity",
        },
      },
      {
        $unwind: "$pro.oldPrice",
      },
      { $unwind: "$pro.Query" },
      {
        $group: {
          _id: "$pro",
          count: { $sum: 1 },
          revenue: { $sum: { $multiply: ["$pro.oldPrice", "$pro.Query"] } },
        },
      },
      {
        $project: {
          "_id.name": 1,
          count: 1,
          revenue: 1,
        },
      },
      {
        $unwind: "$_id.name",
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);
    return data;
  } catch (error) {
    console.log("error when finding top brands:", error);
  }
}

// add filter in this function
//list all the top selling products based on time period
// for that first i need to find the orders in that time period and find the products in that orders
// and count each product from every orders and take the to 5 products

async function mostSellingBrand(dateFilter) {
  // return a array of top 5 Brands [{},{},]
  dateFilter.paymentStatus = {
    $in: ["Paid", "Pending"],
    $nin: ["Cancelled", "Refunded"],
  };
  try {
    const data = await Order.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "pro",
        },
      },
      {
        $unwind: "$pro",
      },
      {
        $set: {
          "pro.oldPrice": "$products.price",
          "pro.Query": "$products.quantity",
        },
      },
      {
        $unwind: "$pro.oldPrice",
      },
      { $unwind: "$pro.Query" },
      {
        $group: {
          _id: "$pro.brand",
          count: { $sum: 1 },
          revenue: { $sum: { $multiply: ["$pro.oldPrice", "$pro.Query"] } },
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "Brands",
        },
      },
      {
        $unwind: "$Brands",
      },
      {
        $set: { Brands: "$Brands.name" },
      },
      {
        $project: {
          Brands: 1,
          count: 1,
          revenue: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);
    return data;
  } catch (error) {
    console.log("error when finding top brands:", error);
  }
}
async function mostSellingCategory(dateFilter) {
  dateFilter.paymentStatus = {
    $in: ["Paid", "Pending"],
    $nin: ["Cancelled", "Refunded"],
  };
  try {
    const data = await Order.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "pro",
        },
      },
      {
        $unwind: "$pro",
      },
      {
        $set: {
          "pro.oldPrice": "$products.price",
          "pro.Query": "$products.quantity",
        },
      },
      {
        $unwind: "$pro.oldPrice",
      },
      { $unwind: "$pro.Query" },
      {
        $group: {
          _id: "$pro.category",
          count: { $sum: 1 },
          revenue: { $sum: { $multiply: ["$pro.oldPrice", "$pro.Query"] } },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categories",
        },
      },
      {
        $unwind: "$categories",
      },
      {
        $set: { categoryName: "$categories.name" },
      },
      {
        $project: {
          categoryName: 1,
          count: 1,
          revenue: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);
    return data;
  } catch (error) {}
}

// function to generate user data
async function generateUserData(dateFilter) {
  let userData = {
    blockedUser: 0,
    totalUser: 0,
  };
}

// generate all the data for chart function and it will return the data in json formate to the client
// const generateChartData = async (req, res) => {
async function generateChartData(req, res) {
  try {
    const { reportType, endDate, startDate } = req.body;
    const quickDate =
      req.body.quickDate === "" ? new Date() : req.body.quickDate;
    console.log(quickDate);
    console.log("request filter form :", req.body);
    const dateFilterCreated = getDateFilter(
      reportType,
      startDate,
      endDate,
      quickDate,
      "created"
    );
    const dateFilterUpdated = getDateFilter(
      reportType,
      startDate,
      endDate,
      quickDate,
      "updated"
    );
    console.log(dateFilterCreated, dateFilterUpdated);

    // const mostSellingProducts = await mostSellingPro(dateFilterUpdated);
    const mostSellingProducts = await filteredProducts(dateFilterCreated);
    // console.log(mostSellingProducts);

    const mostSellingBrandData = await mostSellingBrand(dateFilterCreated);
    const mostSellingCategoryData = await mostSellingCategory(
      dateFilterCreated
    );

    res.status(200).json({
      success: true,
      message: "data for dashboard ",
      mostSellingProducts: mostSellingProducts,
      mostSellingBrandData,
      mostSellingCategoryData,
    });
  } catch (error) {
    console.log(error);
  }
}

export { generateChartData };
