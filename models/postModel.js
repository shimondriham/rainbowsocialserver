const mongoose = require("mongoose");
const Joi = require("joi");


let postSchema = new mongoose.Schema({
    title: String,
    short_id: String,
    url_title: String,
    user_id:String,
    postMessage:String,
    date_created: { type: Date, default: Date.now() },
    url_img:String,
    likes:{type: Array, default: [] },
    comments: { type: Array, default: [] }

})

exports.PostModel = mongoose.model("posts", postSchema);

exports.validatePost = (_reqBody) => {
    let joiSchema = Joi.object({
        title: Joi.string().min(2).max(99).required(),
        url_title: Joi.string().min(1).max(99).required(),
        postMessage: Joi.string().min(1).max(999).required(),
        url_img: Joi.string().min(1).max(999).allow(null,""),  
    })
    return joiSchema.validate(_reqBody);
}