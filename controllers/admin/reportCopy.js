import { User } from "../../models/userModel.js";
import { Order } from "../../models/orderModel.js";

function roundPrice(price) {
  return Math.round(price * 100) / 100;
}

// display the sales report page
const getReport = async (req, res) => {
  // sent all the order data
  const order = await Order.find({});

  console.log(order);
  const totalOrders = order.length;
  let totalOrderAmount = 0;
  let totalDiscount = 0;

  order.forEach((order) => {
    if (order.status !== "Cancelled" || order.status !== "Rejected") {
      totalOrderAmount += order.totalPrice;
      totalDiscount += order.discount;
    }
  });
  let avgOrder = totalOrderAmount / totalOrders;
  return res.status(200).render("admin/report/salesReport2.ejs", {
    user: req.user,
    totalOrders: roundPrice(totalOrders),
    totalOrderAmount,
    totalDiscount: roundPrice(totalDiscount),
    avgOrder: roundPrice(avgOrder),
  });
};

export { getReport };
