import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Create Address Schema
const addressSchema = new Schema({
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
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});



const User = mongoose.model('User', userSchema);

export { User };