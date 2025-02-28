import { Order } from "../../models/orderModel.js";
import { uploadImage } from "../../utils/cloudinary.js";
import fs from "fs/promises"; // Using promises API for async file deletion
import mongoose from "mongoose";

// POST
const createReturnReq = async (req, res) => {
  const orderId = req.body?.orderId;
  const returnMsg = req.body?.reason;

  if (!orderId || !returnMsg || !req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required data." });
  }

  try {
    // Create an array of file paths from req.files
    const imagePaths = req.files.map((file) => {
      console.log(`file name: ${file.filename}, path: ${file.path}`);
      return file.path;
    });

    // Upload images to Cloudinary and get secure URLs
    const productImageUrls = await Promise.all(
      imagePaths.map(async (filePath) => {
        return await uploadImage(filePath);
      })
    );

    // Delete the local image files asynchronously
    await Promise.all(
      imagePaths.map(async (filePath) => {
        await fs.unlink(filePath);
      })
    );

    // Update the order document with return request details
    const result = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          returnMsg: returnMsg,
          returnImg: productImageUrls.map((image) => image.secure_url),
          status: "Return Pending",
        },
      },
      { new: true }
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    console.log("Updated Order:", result);
    res.status(200).json({
      success: true,
      message: "Return request submitted!",
      order: result,
    });
  } catch (error) {
    console.error("Error processing return request:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export { createReturnReq };
