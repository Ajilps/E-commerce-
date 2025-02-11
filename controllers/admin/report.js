import { Order } from "../../models/orderModel.js";
// const Order = require('../models/orderModel');
import PDFDocument from "pdfkit";
import moment from "moment";
import { User } from "../../models/userModel.js";
import excel from "exceljs";

// Helper function to get date filter based on parameters
const getDateFilter = (reportType, startDate, endDate, quickDate) => {
  let dateFilter = {};

  // Validate input parameters
  if (reportType === "custom") {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start) && !isNaN(end)) {
        dateFilter.createdAt = { $gte: start, $lte: end };
      }
    }
  } else {
    const validReportTypes = ["daily", "weekly", "monthly", "yearly"];
    if (validReportTypes.includes(reportType) && quickDate) {
      const selectedDate = moment(quickDate);
      if (selectedDate.isValid()) {
        const range = {
          daily: { start: "day", end: "day" },
          weekly: { start: "week", end: "week" },
          monthly: { start: "month", end: "month" },
          yearly: { start: "year", end: "year" },
        }[reportType];

        dateFilter.createdAt = {
          $gte: selectedDate.startOf(range.start).toDate(),
          $lte: selectedDate.endOf(range.end).toDate(),
        };
      }
    }
  }

  return dateFilter;
};

const orderController = {
  // Render sales report page with filtered data
  getSalesReport: async (req, res) => {
    try {
      const { reportType, startDate, endDate, quickDate } = req.query;
      console.log(reportType, startDate, endDate, quickDate);

      // Get date filter using helper function
      const dateFilter = getDateFilter(
        reportType,
        startDate,
        endDate,
        quickDate
      );
      console.log("data filtered : ", dateFilter);
      // Fetch orders with filter
      const orders = await Order.find(dateFilter).sort({ createdAt: -1 });

      // Calculate summary statistics
      const summary = {
        totalSales: orders.reduce((sum, order) => sum + order.totalPrice, 0),
        totalOrders: orders.length,
        totalDiscounts: orders.reduce((sum, order) => sum + order.discount, 0),
        avgOrderValue: orders.length
          ? Math.round(
              orders.reduce((sum, order) => sum + order.totalPrice, 0) /
                orders.length
            )
          : 0,
      };

      // Safely calculate previous period filter
      const previousPeriodFilter = {};
      if (dateFilter.createdAt?.$gte && dateFilter.createdAt?.$lte) {
        const duration = dateFilter.createdAt.$lte - dateFilter.createdAt.$gte;
        previousPeriodFilter.createdAt = {
          $gte: new Date(dateFilter.createdAt.$gte - duration),
          $lte: new Date(dateFilter.createdAt.$gte),
        };
      }

     

      const previousOrders = await Order.find(previousPeriodFilter);
      const previousSummary = {
        totalSales: previousOrders.reduce(
          (sum, order) => sum + order.totalPrice,
          0
        ),
        totalOrders: previousOrders.length,
        totalDiscounts: previousOrders.reduce(
          (sum, order) => sum + order.discount,
          0
        ),
        avgOrderValue: previousOrders.length
          ? Math.round(
              previousOrders.reduce((sum, order) => sum + order.totalPrice, 0) /
                previousOrders.length
            )
          : 0,
      };

      // Calculate percentage changes
      const changes = {
        salesChange: previousSummary.totalSales
          ? (
              ((summary.totalSales - previousSummary.totalSales) /
                previousSummary.totalSales) *
              100
            ).toFixed(1)
          : 0,
        ordersChange: previousSummary.totalOrders
          ? (
              ((summary.totalOrders - previousSummary.totalOrders) /
                previousSummary.totalOrders) *
              100
            ).toFixed(1)
          : 0,
        discountsChange: previousSummary.totalDiscounts
          ? (
              ((summary.totalDiscounts - previousSummary.totalDiscounts) /
                previousSummary.totalDiscounts) *
              100
            ).toFixed(1)
          : 0,
        avgOrderChange: previousSummary.avgOrderValue
          ? (
              ((summary.avgOrderValue - previousSummary.avgOrderValue) /
                previousSummary.avgOrderValue) *
              100
            ).toFixed(1)
          : 0,
      };

      res.render("admin/report/salesReport", {
        orders,
        summary,
        changes,
        filters: { reportType, startDate, endDate, quickDate },
        moment,
        user: req.user,
        req,
      });
    } catch (error) {
      console.error("Error in sales report:", error);
      res.status(500).send("Error generating sales report");
    }
  },

  // Generate and download PDF report
  downloadPDF: async (req, res) => {
    try {
      const { reportType, startDate, endDate, quickDate } = req.query;

      // Get date filter using helper function
      const dateFilter = getDateFilter(
        reportType,
        startDate,
        endDate,
        quickDate
      );

      // Fetch orders with filter
      const orders = await Order.find(dateFilter).sort({ createdAt: -1 });

      // Calculate summary for PDF
      const summary = {
        totalSales: orders.reduce((sum, order) => sum + order.totalPrice, 0),
        totalOrders: orders.length,
        totalDiscounts: orders.reduce((sum, order) => sum + order.discount, 0),
        avgOrderValue: orders.length
          ? Math.round(
              orders.reduce((sum, order) => sum + order.totalPrice, 0) /
                orders.length
            )
          : 0,
      };

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.pdf"
      );

      doc.pipe(res);

      // Add content to PDF
      doc.fontSize(20).text("Sales Report", { align: "center" });
      doc.moveDown();

      // Add date range information
      if (reportType === "custom") {
        doc
          .fontSize(12)
          .text(`Period: ${startDate} to ${endDate}`, { align: "center" });
      } else if (quickDate) {
        doc
          .fontSize(12)
          .text(
            `${
              reportType.charAt(0).toUpperCase() + reportType.slice(1)
            } Report: ${quickDate}`,
            { align: "center" }
          );
      }
      doc.moveDown();

      // Add summary section
      doc.fontSize(14).text("Summary", { underline: true });
      doc
        .fontSize(12)
        .text(`Total Sales: ₹${summary.totalSales.toLocaleString()}`);
      doc.text(`Total Orders: ${summary.totalOrders}`);
      doc.text(`Total Discounts: ₹${summary.totalDiscounts.toLocaleString()}`);
      doc.text(
        `Average Order Value: ₹${summary.avgOrderValue.toLocaleString()}`
      );
      doc.moveDown();

      // Add orders table
      doc.fontSize(14).text("Detailed Orders", { underline: true });
      doc.moveDown();

      // Table settings
      const startX = 50;
      const columnWidth = 100;
      const pageBottom = doc.page.height - 50;
      const rowPadding = 8;
      let currentY = doc.y;

      // Draw headers
      const headers = ["Order ID", "Date", "Customer", "Total", "Status"];
      headers.forEach((header, i) => {
        doc.fontSize(10).text(header, startX + i * columnWidth, currentY, {
          width: columnWidth,
          align: "left",
        });
      });
      currentY += 20;

      // Draw rows with proper pagination
      orders.forEach((order) => {
        // Calculate row height
        const rowHeight =
          Math.max(
            doc.heightOfString(order.orderId, { width: columnWidth }),
            doc.heightOfString(moment(order.createdAt).format("YYYY-MM-DD"), {
              width: columnWidth,
            }),
            doc.heightOfString(order.shippingAddress?.name || "", {
              width: columnWidth,
            }),
            doc.heightOfString(`₹${order.totalPrice.toLocaleString()}`, {
              width: columnWidth,
            }),
            doc.heightOfString(order.status, { width: columnWidth })
          ) + rowPadding;

        // Check page space
        if (currentY + rowHeight > pageBottom) {
          doc.addPage();
          currentY = 50;

          // Redraw headers on new page
          headers.forEach((header, i) => {
            doc.fontSize(10).text(header, startX + i * columnWidth, currentY, {
              width: columnWidth,
              align: "left",
            });
          });
          currentY += 20;
        }

        // Draw row
        doc
          .fontSize(9)
          .text(order.orderId, startX, currentY, { width: columnWidth })
          .text(
            moment(order.createdAt).format("YYYY-MM-DD"),
            startX + columnWidth,
            currentY,
            { width: columnWidth }
          )
          .text(
            order.shippingAddress?.name,
            startX + columnWidth * 2,
            currentY,
            { width: columnWidth }
          )
          .text(
            `₹${order.totalPrice.toLocaleString()}`,
            startX + columnWidth * 3,
            currentY,
            { width: columnWidth }
          )
          .text(order.status, startX + columnWidth * 4, currentY, {
            width: columnWidth,
          });

        currentY += rowHeight;
      });

      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send("Error generating PDF report");
    }
  },

  // Generate and download Excel report
  downloadExcel: async (req, res) => {
    try {
      const { reportType, startDate, endDate, quickDate } = req.query;

      // Get date filter using helper function
      const dateFilter = getDateFilter(
        reportType,
        startDate,
        endDate,
        quickDate
      );

      // Fetch orders with filter
      const orders = await Order.find(dateFilter).sort({ createdAt: -1 });

      // Calculate summary
      const summary = {
        totalSales: orders.reduce((sum, order) => sum + order.totalPrice, 0),
        totalOrders: orders.length,
        totalDiscounts: orders.reduce((sum, order) => sum + order.discount, 0),
        avgOrderValue: orders.length
          ? Math.round(
              orders.reduce((sum, order) => sum + order.totalPrice, 0) /
                orders.length
            )
          : 0,
      };

      // Create a new workbook
      const workbook = new excel.Workbook();

      // Add a worksheet for summary
      const summarySheet = workbook.addWorksheet("Summary");
      summarySheet.addRow(["Sales Report Summary"]);
      summarySheet.addRow([]); // Empty row for spacing

      // Add date range information
      if (reportType === "custom") {
        summarySheet.addRow([`Period: ${startDate} to ${endDate}`]);
      } else if (quickDate) {
        summarySheet.addRow([
          `${
            reportType.charAt(0).toUpperCase() + reportType.slice(1)
          } Report: ${quickDate}`,
        ]);
      }
      summarySheet.addRow([]); // Empty row for spacing

      // Add summary data
      summarySheet.addRow([
        "Total Sales",
        `₹${summary.totalSales.toLocaleString()}`,
      ]);
      summarySheet.addRow(["Total Orders", summary.totalOrders]);
      summarySheet.addRow([
        "Total Discounts",
        `₹${summary.totalDiscounts.toLocaleString()}`,
      ]);
      summarySheet.addRow([
        "Average Order Value",
        `₹${summary.avgOrderValue.toLocaleString()}`,
      ]);

      // Add a worksheet for detailed orders
      const ordersSheet = workbook.addWorksheet("Detailed Orders");

      // Add headers
      ordersSheet.addRow([
        "Order ID",
        "Date",
        "Customer",
        "Total",
        "Status",
        "Payment Method",
        "Items",
      ]);

      // Add order data
      orders.forEach((order) => {
        ordersSheet.addRow([
          order.orderId,
          moment(order.createdAt).format("YYYY-MM-DD"),
          order.shippingAddress?.name,
          `₹${order.totalPrice.toLocaleString()}`,
          order.status,
          order.paymentMethod,
          order.items?.length || 0,
        ]);
      });

      // Style the worksheets
      summarySheet.getColumn(1).width = 20;
      summarySheet.getColumn(2).width = 20;
      ordersSheet.columns.forEach((column) => {
        column.width = 20;
      });

      // Set headers for download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.xlsx"
      );

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error generating Excel:", error);
      res.status(500).send("Error generating Excel report");
    }
  },
};

export { orderController };
