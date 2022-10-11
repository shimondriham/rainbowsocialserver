const mongoose = require("mongoose");
const Joi = require("joi");
const jwt= require("jsonwebtoken");
const { config } = require("../config/secret");

// creat the userSchema with all the attributis
let userSchema = new mongoose.Schema({
    name: String,
    pass: String,
    BirthDay:Date,
    email: String,
    creatDate: { type: Date, default: Date.now() },
    role: { type: String, default: "user" },
    adress:String,
    phone:String,
    about:String,
    message:{type:Array,default:[]},
    post:{type:Array,default:[]},
    followers:{type:Array,default:[]},
    gender:{ type: String, default: "" }
})



// export and creat the user model to talk with the db 
exports.UserModel=  mongoose.model('users', userSchema);
// 
exports.genToken=(userId,role)=>{
    let token= jwt.sign({id:userId,role:role},config.jwtSecret,{expiresIn:"600mins"});
    return token;
}

exports.validateUser = (_reqBody) => {
    let joiSchema = Joi.object({
        name: Joi.string().min(2).max(99).required(),
        email: Joi.string().min(1).max(999).required().email(),
        pass: Joi.string().min(2).max(99).required(),
        address: Joi.string().min(2).max(300).allow(null,""),
        phone: Joi.string().min(2).max(300).allow(null,""),
        about: Joi.string().min(15).max(500).allow(null,""),
        BirthDay: Joi.date().allow(null,""),
        gender: Joi.string().min(2).max(10).allow(null,""),
        
    })
    return joiSchema.validate(_reqBody);
}

exports.validatelogin = (_reqBody) => {
    let joiSchema = Joi.object({
        email: Joi.string().min(1).max(999).required().email(),
        pass: Joi.string().min(2).max(99).required(),
    })
    return joiSchema.validate(_reqBody);
}