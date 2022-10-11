const mongoose = require("mongoose");
const Joi = require("joi");



let messageSchema = new mongoose.Schema({
    sender_id:String,
    recipient_id:String,
    Message:String,
    url_img:String,
    date_created: { type: Date, default: Date.now() },
})

exports.messageModel=  mongoose.model('messages', messageSchema);

exports.validateMessage = (_reqBody) => {
    let joiSchema = Joi.object({
        Message: Joi.string().min(1).max(999).required(),
        url_img: Joi.string().min(1).max(999).allow(null,""),  
    })
    return joiSchema.validate(_reqBody);
}