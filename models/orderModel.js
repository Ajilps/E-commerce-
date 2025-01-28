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
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        orderId:{
            type:String,
            required: true,
        },
        discount:{
            type: Number,
            required: false,
        },tax:{
            type: Number,
            required: false,
        },
        shippingAddress:{
            type: String,
            required: true,
        },
        billingAddress:{
            type: String,
            required: true,
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        paymentStatus:{
            type: String,
            enum: ["Pending", "Processing", "Completed"],
            default: "Pending",
        },
        orderNotes:{
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
        trackingNumber: {
            type: String,
            required: false,
        },
        deliveryDate: {
            type: Date,
            required: false,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export { Order };