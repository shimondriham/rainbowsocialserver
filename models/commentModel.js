const mongoose = require("mongoose");
const Joi = require("joi");

// creat the userSchema with all the attributis
let commentsSchema = new mongoose.Schema({
    user_id: String,
    post_id: String,
    info_comment: String,
    creatDate: { type: Date, default: Date.now() },
    url_img:String,
    likes:{type: Array, default: [] }   
})
// export and creat the user model to talk with the db 
exports.CommentModel=  mongoose.model('comments', commentsSchema);

// creat valdite for comment schema
exports.validateComment = (_reqBody) => {
    let joiSchema = Joi.object({
        info_comment: Joi.string().min(2).max(999).required(),
        url_img: Joi.string().min(1).max(99).allow(null,"") 
    })
    return joiSchema.validate(_reqBody);
}