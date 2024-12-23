import mongoose, { Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Create Address Schema
const addressSchema = new Schema({
    phone:{
        type: Number,
        required: true
    },
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

// user Schema 
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // Modified to use array of address objects
    addresses: [addressSchema],
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    refreshToken: {
        type: String,
        default: '1'
    },
    wishlist:
         [{
        type: Schema.Types.ObjectId,
        ref: 'Product',
 
    }],
    orders: [{
        type: Schema.Types.ObjectId,
        ref: 'Order'
    }],
    updatedBy:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: "self"
    }
    

},{timestamps: true});

//checking the password is modified or not
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcryptjs.hash(this.password, 10);
    }
    next();
});


//checking the password is same as the password in the database
userSchema.methods.isPasswordMatch = async function (password) {
    return await bcryptjs.compare(password, this.password);
};

// Generate Auth token
userSchema.methods.generateAuthToken = async function () {
    try {
     const token= await jwt.sign(
         {
             _id: this._id,
             email: this.email,
             role: this.role
 
         },
         process.env.JWT_SECRET,
         {
             expiresIn: process.env.JWT_EXPIRE,
             algorithm: 'HS256'
         }
     )
    //  console.log(`generateAuthToken - ${token}`);//debug
     return token;
   } catch (error) {
    console.error(`generateAuthToken failed - ${error.message}`);
    throw error;
   }
}

// create refresh token method
userSchema.methods.generateRefreshToken = async function () {

  try {
      const refresh =  await jwt.sign(
          {
              _id: this._id,
              email: this.email,
  
          },
          process.env.JWT_SECRET,
          {
              expiresIn: process.env.JWT_COOKIE_EXPIRE
          }
      )
      return refresh;
  } catch (error) {
    console.error(`generateRefreshToken failed - ${error.message}`);
  }
}   


const User = mongoose.model('User', userSchema);

export { User };