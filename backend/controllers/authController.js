import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { isValidEmail, isValidPassword } from "../utils/validators.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const googleClient = new OAuth2Client();


export const registerUser= async(req, res)=>{
    const {name,email,password} = req.body;
    if(!name||!email || !password){
        res.status(400);
        throw new Error("Please fill all the fields")
    }
    if(!isValidEmail(email)){
        res.status(400);
        throw new Error("Invalid email");
    }
    if(!isValidPassword(password)){
        res.status(400);
        throw new Error("valid password should be generated");
    }
    const userExists = await User.findOne({email});
    if(userExists){
        res.status(400);
        throw new Error('User already exist');
    }
    const user = await User.create({name,email,password});
    generateToken(res,user._id)
    res.status(201).json({
        _id:user._id,
        name: user.name,
        email: user.email,
        role: user.role
    })
}
 export const loginUser =  async(req,res)=>{
    const { email, password} = req.body;
    if( !email || ! password){
        res.status(400);
        throw new Error('Please fill all the fields');
    }
    const user = await User.findOne({email});
    if (user && (await user.matchPassword(password))){
        generateToken(res,user._id)
        res.status(200).json({
        _id:user._id,
        name: user.name,
        email: user.email,
        role: user.role
    })}
    else{
        res.status(401)
        throw new Error('Invalid email or password')
    }
}
export const googleAuth = async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        res.status(400);
        throw new Error("Missing Google credential");
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
        res.status(500);
        throw new Error("Google sign-in is not configured");
    }
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch {
        res.status(401);
        throw new Error("Invalid Google credential");
    }
    if (!payload?.email_verified) {
        res.status(401);
        throw new Error("Google account email is not verified");
    }
    let user = await User.findOne({ email: payload.email });
    if (!user) {
        // Google users get an unguessable random password; they sign in via Google only
        user = await User.create({
            name: payload.name || payload.email.split("@")[0],
            email: payload.email,
            password: crypto.randomBytes(32).toString("hex"),
            googleId: payload.sub,
        });
    } else if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
    }
    generateToken(res, user._id);
    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    });
};
export const logoutUser = (req,res)=> {
    res.cookie('jwt','',{
        httpOnly: true,
        expires: new Date(0),
    })
    res.status(200).json({message: 'Logged out successfully'});
}
export const getMe = async (req,res) =>{
    res.status(200).json(req.user);
};
