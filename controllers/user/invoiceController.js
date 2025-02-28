import { Order } from "../../models/orderModel.js";
import { User } from "../../models/userModel.js";

import { jsPDF } from "jspdf";

// Function to generate PDF
function generateOrderPDF(orderData) {
  const doc = new jsPDF();

  let y = 20;

  // Company header
  doc.setFontSize(20);
  doc.text("Bytez", 105, y, { align: "center" });

  // Order details header
  y += 20;
  doc.setFontSize(16);
  doc.text("Order Confirmation", 20, y);

  // Order basic details
  y += 10;
  doc.setFontSize(12);
  doc.text(`Order ID: ${orderData.orderId}`, 20, y);
  y += 10;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, y);

  // Customer details
  y += 20;
  doc.setFontSize(14);
  doc.text(" Address:", 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(
    [
      orderData.shippingAddress.name,
      orderData.shippingAddress.address,
      `${orderData.shippingAddress.city}, ${orderData.shippingAddress.state}`,
      orderData.shippingAddress.country,
      `Phone: ${orderData.shippingAddress.phone}`,
    ],
    20,
    y
  );

  // Order summary
  y += 40;
  doc.setFontSize(14);
  doc.text("Order Summary", 20, y);
  y += 10;

  // Table headers
  doc.setFontSize(12);
  doc.text("Description", 20, y);
  doc.text("Quantity", 100, y);
  doc.text("Price", 140, y);
  doc.text("Total", 180, y);

  // Draw line under headers
  y += 2;
  doc.line(20, y, 190, y);

  // Product details
  y += 10;
  orderData.products.forEach((product) => {
    doc.text("Product", 20, y);
    doc.text(product.quantity.toString(), 100, y);
    doc.text(`${product.price.toLocaleString()}`, 140, y);
    doc.text(`${(product.price * product.quantity).toLocaleString()}`, 180, y);
    y += 10;
  });

  // Draw line above totals
  y += 5;
  doc.line(20, y, 190, y);
  y += 10;

  // Order totals
  doc.text("Subtotal:", 140, y);
  doc.text(`${orderData.subtotal.toLocaleString()}`, 180, y);
  y += 10;

  doc.text("Tax:", 140, y);
  doc.text(`${orderData.tax.toLocaleString()}`, 180, y);
  y += 10;

  if (orderData.discount > 0) {
    doc.text("Discount:", 140, y);
    doc.text(`-${orderData.discount.toLocaleString()}`, 180, y);
    y += 10;
  }

  if (orderData.shippingFee > 0) {
    doc.text("Shipping:", 140, y);
    doc.text(`${orderData.shippingFee.toLocaleString()}`, 180, y);
    y += 10;
  }
  if (orderData?.couponDiscount) {
    doc.text("coupon Discount:", 140, y);
    doc.text(`${orderData.couponDiscount.toLocaleString()}`, 180, y);
    y += 10;
  }

  // Final total
  y += 5;
  doc.line(140, y, 190, y);
  y += 10;
  doc.setFont(undefined, "bold");
  doc.text("Total:", 140, y);
  doc.text(`${orderData.totalPrice.toLocaleString()}`, 180, y);

  // Payment details
  y += 20;
  doc.setFont(undefined, "normal");
  doc.text(`Payment Method: ${orderData.paymentMethod}`, 20, y);
  y += 10;
  doc.text(`Payment Status: ${orderData.paymentStatus}`, 20, y);

  // Footer
  doc.setFontSize(10);
  doc.text("Thank you for your order!", 105, 280, { align: "center" });

  return doc;
}

// Express route handler
export const generateOrderPDFHandler = async (req, res) => {
  try {
    // Get order data from request body or fetch from database
    // const orderId = req.query?.orderId;  // Or: await Order.findById(req.params.orderId);

    const orderData = await Order.findById(req.query?.orderId);
    console.log(orderData);

    // Validate order data

    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data",
      });
    }

    // Generate PDF
    const doc = generateOrderPDF(orderData);

    // Get PDF as buffer
    const pdfBuffer = doc.output("arraybuffer");
    console.log(pdfBuffer);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="order-${orderData.orderId}.pdf"`
    );

    // Send PDF
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
      error: error.message,
    });
  }
};
