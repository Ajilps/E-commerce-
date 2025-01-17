import e from "express";
import mongoose  from "mongoose";   
const { Schema } = mongoose;

const brandSchema = new Schema({
    
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
    },offer:{
        type: Number,
        default: 0
    }
    ,public_id:{
        type:String,
        required:true
    },status:{
        type:Boolean,
        default: true
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
    createdAt: {    
        type: Date,
        default: Date.now
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


}, 
{ timestamps: true });


const Brand = mongoose.model('Brand', brandSchema); 
export  {Brand};