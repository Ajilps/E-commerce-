import mongoose from 'mongoose';
const {Schema} = mongoose;

// Define the Coupon Schema
const couponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true, // Ensures the code is stored in uppercase
    trim: true, // Removes unnecessary spaces
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'], // Discount can either be a percentage or a flat amount
    required: true,
  },
  discountValue: {
    type: Number,
    required: true, // Discount value (e.g., 20 for 20% or $20)
    min: 0, // Ensures no negative discount values
  },
  maxDiscount: {
    type: Number,
    default: null, // Maximum discount amount for percentage-based coupons
  },
  minPurchase: {
    type: Number,
    default: 0, // Minimum purchase amount to apply the coupon
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true, // The date when the coupon becomes invalid
  },
  usageLimit: {
    type: Number,
    default: null, // The maximum number of times this coupon can be used
  },
  usageCount: {
    type: Number,
    default: 0, // Track the number of times this coupon has been used
  },
  userRestrictions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Restricts coupon usage to specific users
    },
  ],
  isActive: {
    type: Boolean,
    default: true, // Indicates whether the coupon is currently active
  },
 
}, {timestamps: true});

// Define a method to check coupon validity
couponSchema.methods.isValid = function () {
  const currentDate = new Date();
  return (
    this.isActive &&
    currentDate >= this.startDate &&
    currentDate <= this.expiryDate &&
    (this.usageLimit === null || this.usageCount < this.usageLimit)
  );
};

// Create the Coupon model
const Coupon = mongoose.model('Coupon', couponSchema);

export { Coupon };
