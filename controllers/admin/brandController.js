import { Brand } from "../../models/brandModel.js";
import { Category } from "../../models/categoryModel.js";
import { Product } from "../../models/productModel.js";
import { uploadImage, deleteImage } from "../../utils/cloudinary.js";
import fs from "fs";

const brandInfo = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 4;
  const skip = (page - 1) * limit;

  const totalBrands = await Brand.countDocuments();
  const totalPages = Math.ceil(totalBrands / limit);
  // const brands = await Brand.find({})
  const brandData = await Brand.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .then((brands) => {
      res.render("admin/brand/brand.ejs", {
        brands,
        currentPage: page,
        totalPages: totalPages,
        totalBrands: totalBrands,
        user: req.user,
      });
    })
    .catch((err) => {
      console.error(`Error retrieving brand data - ${err.message}`);
      res.redirect("/pageerror");
    });
};

const editBrandDisplay = async (req, res) => {
  const brandId = req.query.id;
  const brand = await Brand.findById(brandId);
  res.render("admin/brand/editBrand.ejs", { brand, user: req.user });
};

// update brand
const updateBrand = async (req, res) => {
  const { name, description } = req.body;
  const brandId = req.body.brandId;
  const updatedBy = req.user._id;
  console.log(req?.file);

  if (req.file.filename) {
    uploadImage(req.file.path)
      .then(async (result) => {
        console.log(result); // testing the result
        fs.unlinkSync(req.file.path);

        Brand.findByIdAndUpdate(brandId, {
          name,
          description,
          updatedBy,
          imageUrl: result.secure_url,
          public_id: result.public_id,
        })
          .then(() => {
            res
              .status(200)
              .json({ success: true, message: "Brand updated successfully" });
          })
          .catch((err) => {
            console.error(`Error updating brand - ${err.message}`);
            res
              .status(400)
              .json({ success: false, message: "Failed to update brand" });
          });
      })
      .catch((err) => {
        console.error(`Error updating brand - ${err.message}`);
        res
          .status(400)
          .json({ success: false, message: "Failed to update brand" });
      });
  } else {
    Brand.findByIdAndUpdate(brandId, {
      name,
      description,
      updatedBy,
    })
      .then(() => {
        res
          .status(200)
          .json({ success: true, message: "Brand updated successfully" });
      })
      .catch((err) => {
        console.error(`Error updating brand - ${err.message}`);
        res
          .status(400)
          .json({ success: false, message: "Failed to update brand" });
      });
  }
  console.log(name, description, updatedBy);
};

//===============================================// delete brand
const deleteBrand = async (req, res) => {
  const brandId = req.query.id;
  if (!brandId) {
    return res
      .status(400)
      .json({ success: false, message: "Brand ID is required" });
  }
  // or make the brand as disable
  //   await Brand.findByIdAndUpdate({brandId},{$set:{status:false}})

  const brand = await Brand.findById(brandId);
  await deleteImage(brand?.public_id);
  Brand.findByIdAndDelete(brandId)
    .then(() => {
      res
        .status(200)
        .json({ success: true, message: "Brand deleted successfully" });
    })
    .catch((err) => {
      console.error(`Error deleting brand - ${err.message}`);
      res
        .status(400)
        .json({ success: false, message: "Failed to delete brand" });
    });
};

// list brand
const listBrand = async (req, res) => {
  const brandId = req?.query?.id;
  if (!brandId)
    return res
      .status(400)
      .json({ success: false, message: "brand Id required" });
  await Brand.findByIdAndUpdate(brandId, { $set: { isListed: true } });
  return res.status(200).redirect("/admin/brand");
};
//  un-list brand
const Un_listBrand = async (req, res) => {
  const brandId = req?.query?.id;
  if (!brandId)
    return res
      .status(400)
      .json({ success: false, message: "brand Id required" });
  await Brand.findByIdAndUpdate(brandId, { $set: { isListed: false } });
  return res.status(200).redirect("/admin/brand");
};

// creating new brand and saving to database
const addBrand = async (req, res) => {
  try {
    // upload image to cloudinary and get the secure url
    uploadImage(req.file.path).then(async (result) => {
      console.log(result); // testing the result
      fs.unlinkSync(req.file.path); // delete the file from the server after uploading to cloudinary

      const { name, description } = req.body;
      const imageUrl = result.secure_url;
      const public_id = result.public_id;
      console.log(req.file);
      const createdBy = req.user._id;
      console.log(name, description, createdBy);
      const brand = new Brand({
        name: name,
        description,
        createdBy,
        imageUrl,
        public_id,
      });
      console.log(brand);
      await brand
        .save()
        .then(() => {
          res
            .status(201)
            .json({ success: true, message: "Brand added successfully" });
        })
        .catch((err) => {
          console.error(`Error adding brand - ${err.message}`);
          res
            .status(400)
            .json({ success: false, message: "Failed to add brand" });
        });
    });
  } catch (error) {}
};

// add offer
const addBrandOffer = async (req, res) => {
  try {
    const brandId = req.body.brandId;
    if (!brandId)
      return res
        .status(401)
        .json({ success: false, message: "brand Id is required" });
    const offer = req.body.offer;
    if (!offer)
      return res
        .status(401)
        .json({ success: false, message: "invalid offer " });

    await Brand.findByIdAndUpdate(brandId, { $set: { offer: offer } })
      .then((data) => {
        // console.log(data);// test
        return res
          .status(201)
          .json({ success: true, message: "offer added successfully" });
      })
      .catch((err) => {
        console.error(`Error in adding offer for the brand - ${err.message}`);
        return res
          .status(401)
          .json({ success: false, message: "invalid brand Id " });
      });

    // return res.status(404).json({success:false,message:'invalid brand Id '});
  } catch (error) {
    console.log(`Error in adding offer for the brand `);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// delete brand offer
const removeBrandOffer = async (req, res) => {
  try {
    const brandId = req.body.brandId;
    if (!brandId)
      return res
        .status(401)
        .json({ success: false, message: "brand Id is required" });
    const brand = await Brand.findByIdAndUpdate(brandId, {
      $set: { offer: null },
    })
      .then((data) => {
        // console.log(data);
        return res
          .status(200)
          .json({ success: true, message: "offer removed successfully" });
      })
      .catch((err) => {
        console.error(`Error in removing offer for the brand - ${err.message}`);
        return res
          .status(401)
          .json({ success: false, message: "Invalid brand id " });
      });
  } catch (error) {
    console.log(`Error in removing offer for the brand `);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

export {
  brandInfo,
  addBrand,
  updateBrand,
  editBrandDisplay,
  deleteBrand,
  listBrand,
  Un_listBrand,
  addBrandOffer,
  removeBrandOffer,
};
