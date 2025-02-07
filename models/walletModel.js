import mongoose, { Schema } from "mongoose";
import { User } from "./userModel.js";
import { Order } from "./orderModel.js";
const walletSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["Deposit", "Withdrawal", "Purchase"],
          required: true,
        },
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Order,
        },
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "completed",
        },
        description: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", walletSchema);

export { Wallet };
