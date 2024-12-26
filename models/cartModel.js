import mongoose from 'mongoose';
const {Schema} = mongoose;

const cartSchema = new Schema({
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

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;