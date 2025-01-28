import { Order } from "../../models/orderModel.js";
import { Wishlist } from "../../models/wishlistModel.js";
import { Product } from "../../models/productModel.js";
import { Cart } from "../../models/cartModel.js";

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
      console.log(product.productId.quantity);
      let pro = await Product.findById(product.productId._id);
      if (pro.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.productId.name} has insufficient stock`,
        });
      }
    }

    let products = [];
    let totalPrice = 0;

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

      console.log(`Product after stock update: ${updatedProduct}`);

      // Add product details to the order
      products.push({
        productId: product.productId._id,
        quantity: product.quantity,
        price: product.productId.sellingPrice,
      });

      // Calculate total price
      totalPrice += Math.ceil(
        product.productId.sellingPrice * product.quantity
      );
    }

    // Add 18% tax to the total price
    totalPrice += Math.ceil(totalPrice * 0.18);

    // Create the order
    const order = new Order({
      userId,
      products,
      totalPrice,
      shippingAddress: req.body.address,
      billingAddress: req.body.address,
      paymentMethod: req.body.payment,
      orderNotes: req.body?.notes,
      orderId: generateOrderId(),
    });

    // Save the order
    await order.save();

    // Delete the cart
    await Cart.findOneAndDelete({ user: userId });

    // Respond with success
    return res.status(200).json({ success: true, user: req.user, order });
  } catch (error) {
    console.error(`User order placement failed: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// // placeOrder (post)
// const placeOrder = async (req, res) => {
//   try {
//     // console.log(req.body);
//     const userId = req.user._id;
//     let products = [];
//     const cart = await Cart.findOne({ user: userId }).populate(
//       "products.productId"
//     );
//     let totalPrice = 0;
//     cart.products.forEach((product) => {
//       products.push({
//         productId: product.productId._id,
//         quantity: product.quantity,
//         price: product.productId.sellingPrice,
//       });
//     });
//     // console.log(products); //testing
//     cart.products.forEach(async (product) => {
//       // decreasing the item stoke by the quantity

//       const pro = await Product.findByIdAndUpdate(
//         product._id,
//         { $inc: { quantity: -product.quantity } },
//         { new: true } // Return the updated document
//       );
//       console.log(`pro after stock updation   ${pro}`);
//     });

//     cart.products.forEach((product) => {
//       //   console.log(` testing from place order product id's ${product._id}`);

//       totalPrice += Math.ceil(
//         product.productId.sellingPrice * product.quantity
//       );
//       totalPrice += Math.ceil(totalPrice * 0.18);
//     });
//     // console.log(req.body);//testing
//     const order = new Order({
//       userId,
//       products,
//       totalPrice,
//       shippingAddress: req.body.address,
//       billingAddress: req.body.address,
//       paymentMethod: req.body.payment,
//       orderNotes: req.body?.notes,
//     });
//     await order.save();
//     await Cart.findOneAndDelete({ user: userId });
//     return res.status(200).json({ success: true, user: req.user, order });
//   } catch (error) {
//     console.error(`user order placement failed - ${error.message}`);
//   }
// };

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

    await Order.findByIdAndDelete(orderId);
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
};
