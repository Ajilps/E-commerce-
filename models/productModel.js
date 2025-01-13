import mongoose from 'mongoose';
const {Schema} = mongoose;


const productSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    productId:{
        type: String,
        required: true
    },
    regularPrice: {
        type: Number,
        required: true
    },
    sellingPrice:{
        type: Number,
        required: true
    },
    offer:{
        type: Number,
        default:0
    },
    quantity: {
        type: Number,
        required: true,
        description: 'Number of items in stock'
    },
    productImageUrls:{
        type: [String],
        required: true
     },
    description: {
        type: String,
        required: true
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: 'Brand'
    },  
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    rating: {
        type: Number,
        default: 0
    },
    colors: {
        type: [String],
        required: true
    },
    sizes: {
        type: [Number],
        required: true
    }, 
     tags:{
         type: [String],
         required: true
 
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }], 
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    isFeatured:{
        type: Boolean,
        default: false
    },
    isPopular:{
        type: Boolean,
        default: false
    },
    isTrending:{
        type: Boolean,
        default: false
    },
    isRecommended:{
        type: Boolean,
        default: false
    },
    isBestSeller:{
        type: Boolean,
        default: false
    },
    isOnSale:{
        type: Boolean,
        default: false
    },
    isTopRated:{
        type: Boolean,
        default: false
    },
    isLimited:{
        type: Boolean,
        default: false
    },
    isExclusive:{
        type: Boolean,
        default: false
    },
     
     isBlocked:{
        type: Boolean,
        default: false
     },
     status:{
        type: String,
        required: true,
        default: 'Available',
        enum: ['Available', 'Out of stock', 'Discontinued']
     },

},{timestamps:true});

const Product = mongoose.model('Product', productSchema);

export {Product};
