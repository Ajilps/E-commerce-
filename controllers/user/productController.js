import { Category } from "../../models/categoryModel.js";
import { Product } from "../../models/productModel.js";
import { Brand } from "../../models/brandModel.js";
import { User } from "../../models/userModel.js";
import { Wishlist } from "../../models/wishlistModel.js";
import mongoose from "mongoose";
import paginateResults from "../../middlewares/paginationMiddleware.js";

// no product editing functions

//display all products for lon logged in user

const displayAllProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $unwind: "$brand",
      },
    ]);
    res.render("index.ejs", { products });
  } catch (error) {
    console.log("error form display all product:", error);
    return res.redirect("/");
  }
};

// display product for logged in user
const displayProductUser = async (req, res) => {
  const productId = req.params.productId;
  try {
    const product = (
      await Product.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(`${productId}`) },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "variantId",
            foreignField: "_id",
            as: "variants",
          },
        },
        {
          $unwind: "$category",
        },
        {
          $unwind: "$brand",
        } /* {
              $unwind:{ path: "$variants",
                  preserveNullAndEmptyArrays: true,
              },
            }, */,
      ])
    )[0];

    console.log(product.variants);

    return res.render("user/product/product.ejs", { product, user: req.user });
  } catch (error) {
    console.log(error);
    return res.redirect("/user/home");
  }
};
//display User Home page list display

const displayUserHome = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $unwind: "$brand",
      },
    ]);

    return res.render("user/userHome.ejs", { user: req.user, products });
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
};

//displayStore
const displayStore = async (req, res) => {
  // Initializing the search elements
  const category = req.query?.category || null;
  const availability = req.query?.availability || null;
  const priceFrom = req.query?.priceFrom || null;
  const priceTo = req.query?.priceTo || null;
  const brand = req.query?.brand || null;
  const rating = req.query?.rating || null;
  const discount = req.query?.discount || null;

  const search = req.query?.search || null;
  const sort = req.query?.sort || "none";
  // Pagination
  const page = parseInt(req?.query?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // Building the aggregation pipeline
  const pipeline = [];

  // prevent fetching unlisted products
  pipeline.push({ $match: { isBlocked: false } });
  // Match stage for filtering
  const matchStage = { $match: {} };
  if (search) matchStage.$match.name = { $regex: search, $options: "i" };
  if (search) {
    matchStage.$match.$or = [
      { name: { $regex: search, $options: "i" } },
      { tags: { $in: search.split(" ") } },
    ];
  }
  if (category)
    matchStage.$match.category = new mongoose.Types.ObjectId(`${category}`);
  if (availability === "InStock") {
    matchStage.$match.quantity = { $gt: 0 };
  } else if (availability === "OutOfStock") {
    matchStage.$match.quantity = { $lte: 0 };
  } else if (availability === "All") {
    matchStage.$match.quantity = { $gte: 0 };
  }
  if (priceFrom) matchStage.$match.price = { $gte: parseFloat(priceFrom) };
  if (priceTo)
    matchStage.$match.price = {
      ...matchStage.$match.price,
      $lte: parseFloat(priceTo),
    }; // check this line
  if (brand) matchStage.$match.brand = new mongoose.Types.ObjectId(`${brand}`);
  if (rating) matchStage.$match.rating = { $gte: parseFloat(rating) };
  if (discount) matchStage.$match.offer = { $gte: parseFloat(discount) };
  pipeline.push(matchStage);

  // Lookup stages for category and brand
  pipeline.push(
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $unwind: "$brand",
    }
  );

  // Sorting stage
  const sortStage = { $sort: {} };
  if (req.query.sort === "name-asc") sortStage.$sort.name = 1;
  if (req.query.sort === "name-desc") sortStage.$sort.name = -1;
  if (req.query.sort === "price-asc") sortStage.$sort.sellingPrice = 1;
  if (req.query.sort === "price-desc") sortStage.$sort.sellingPrice = -1;
  if (req.query.sort === "rating-asc") sortStage.$sort.rating = 1;
  if (req.query.sort === "rating-desc") sortStage.$sort.rating = -1;
  if (req.query.sort === "discount-asc") sortStage.$sort.offer = 1;
  if (req.query.sort === "discount-desc") sortStage.$sort.offer = -1;
  if (Object.keys(sortStage.$sort).length) pipeline.push(sortStage); // the use of this line is to check if the sortStage is empty

  // Pagination stages
  pipeline.push({ $skip: skip }, { $limit: limit });

  // Count total documents
  const countPipeline = [...pipeline];
  countPipeline.push({ $count: "totalCount" });

  try {
    // Run the aggregation
    //   console.log(pipeline) // testing
    const [products, totalCountResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline),
    ]);

    const totalCount =
      totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;
    const totalPages = Math.ceil(totalCount / limit);
    // collect the categories, brands, wishlist
    const categories = await Category.find({});
    const brands = await Brand.find({});
    const wishlist = await Wishlist.find({ user: req.user._id });

    // console.log(wishlist[0].products[0].productId.equals(products[0]._id));

    // Render the result
    return res.render("user/product/store.ejs", {
      user: req.user,
      products,
      currentPage: page,
      totalPages,
      category,
      availability,
      priceFrom,
      priceTo,
      brand,
      rating,
      discount,
      sort,
      search,
      categories,
      brands,
      wishlist,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

//   try {
//     const products = await Product.aggregate([
//       {
//         $lookup: {
//           from: "categories",
//           localField: "category",
//           foreignField: "_id",
//           as: "category",
//         },
//       },
//       {
//         $lookup: {
//           from: "brands",
//           localField: "brand",
//           foreignField: "_id",
//           as: "brand",
//         },
//       },
//       {
//         $unwind: "$category",
//       },
//       {
//         $unwind: "$brand",
//       },
//     ]);
//     return res
//       .status(200)
//       .render("user/product/store.ejs", { user: req.user, products });
//   } catch (error) {}
//}

export {
  displayProductUser,
  displayUserHome,
  displayAllProducts,
  displayStore,
};
