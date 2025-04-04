import mongoose from "mongoose";

const orderSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        // returnImg: {
        //   type: String,
        //   required: false,
        // },
        // status: {
        //   type: String,
        //   required: true,
        //   enum: [
        //     "Pending",
        //     "Shipped",
        //     "Delivered",
        //     "Cancelled",
        //     "Rejected",
        //     "Placed",
        //     "Returned",
        //     "Return Pending",
        //     "Return Approved",
        //     "Return Rejected",
        //   ],
        // },

        // returnMsg: {
        //   type: String,
        //   required: false,
        //   default: "",
        // },
        // returnReject: {
        //   type: Boolean,
        //   default: false,
        // },
        // returnPaymentStatus: {
        //   type: String,
        //   required: false,
        //   enum: ["Refunded", "Cancelled"],
        //   default: "",
        // },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: false,
    },
    shippingFee: {
      type: Number,
      required: false,
      default: 0,
    },
    coupon: {
      type: String,
      default: "",
    },
    discount: {
      type: Number,
      required: false,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    shippingAddress: {
      type: Object,
      required: true,
    },
    billingAddress: {
      type: Object,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "COD", "wallet"],
      required: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Completed",
        "Paid",
        "Refunded",
        "Cancelled",
      ],
      default: "Pending",
    },
    orderNotes: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Rejected",
        "Placed",
        "Returned",
        "Return Pending",
        "Return Approved",
        "Return Rejected",
      ],
      default: "Placed",
    },
    retReject: {
      type: Boolean,
      default: false,
    },
    returnImg: {
      type: [String],
    },
    returnMsg: {
      type: String,
    },
    trackingNumber: {
      type: String,
      required: false,
    },
    deliveryDate: {
      type: Date,
      required: false,
    },
    returnDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export { Order };
