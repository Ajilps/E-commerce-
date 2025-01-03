import mongoose from 'mongoose';
const {Schema} = mongoose;


const productSchema = new Schema({
    name: {
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
    countInStock: {
        type: Number,
        required: true,
        description: 'Number of items in stock'
    },
    imageUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },  
    category: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    color: {
        type: String,
        required: true
    },
    size: {
        type: String,
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
     productImage:{
        type: [String],
        required: true
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
