import mongoose from "mongoose";
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        addedOn: {
            type: Date,
            default: Date.now
        },
        quantity: {
            type: Number,
            default: 1
        },

    }],
    createdAt: {    
        type: Date,
        default: Date.now
    },
    updatedAt: {    
        type: Date,
        default: Date.now
    },
    
}, 
{ timestamps: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
