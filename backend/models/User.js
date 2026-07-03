import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
 const userSchema = new mongoose.Schema({
    name: {
        type:  String,
        required: [true,'Name is required'],
        trim:true
    },
    email: {
        type: String,
        required: [true,'email is required'],
        trim:true,
        unique:true,
        lowercase: true,
        trim:true
    },
    password: {
        type: String,
        required: [true,'pass is required'],
        minlength: [6,'Pass must be 6 char']
    },
    role: {
        type: String,
        enum:['user','admin'],
        default: user
    },
    isActive:{
        type: Boolean,
        default: true

    }
 },{timestamps:true})