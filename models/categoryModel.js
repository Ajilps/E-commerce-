import mongoose from "mongoose";
const { Schema } = mongoose;

const categorySchema = new Schema({

    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    isListed: {
        type: Boolean,
        default: true
    },
    categoryOffers:{
        type:Number,
        default:0
    },
    createdAt: {    
        type: Date,
        default: Date.now
    },

}, 
{ timestamps: true });

const Category = mongoose.model('Category', categorySchema);

export default Category;


