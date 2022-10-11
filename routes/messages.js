const express = require("express");
const { random, filter } = require("lodash");
// const { route } = require(".");
const jwt= require("jsonwebtoken");
const { config } = require("../config/secret");
const { auth, authAdmin } = require("../middels/auth");
const { messageModel, validateMessage } = require("../models/messageModel");
const { UserModel } = require("../models/userModel");
const router = express.Router();


// bring all the users i had chat with them
router.get("/MyChat", async (req, res) => {
    let token = req.header("x-api-key");
    let decode= jwt.verify(token,config.jwtSecret);
    req.userToken=decode;
    let id_user = req.userToken.id
    console.log(id_user);
    try {
        let Chats = await messageModel.find({ $or: [{recipient_id:id_user},{ sender_id: id_user }] })
        let ar_sender=[];
        let ar_recipient=[];
        let ar_all=[];
        let ar=[];
         ar_sender = [... new Set(Chats.map(data => data.sender_id))]
        //  console.log(ar_sender);
         ar_recipient = [... new Set(Chats.map(data => data.recipient_id))]
        //  console.log(ar_recipient);
         ar_all=[...ar_sender,...ar_recipient];
         ar=ar_all.filter(item=>item!=id_user);
         let unique = ar.filter(onlyUnique);
    
        res.json(unique)
    } catch (error) {
        res.json(error)
    }
})
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

router.get("/userMessage/:id",auth,async(req,res)=>{
    let id=req.params.id;
    let id_user=req.userToken.id
    let messages1 = await messageModel.find( {sender_id: id ,recipient_id:id_user});
    let messages2 = await messageModel.find({ sender_id: id_user ,recipient_id:id});
    let ar_messages=[...messages1,...messages2];
    res.json(ar_messages)
})

router.get("/:id",authAdmin, async (req, res) => {
    let id_user = req.params.id;
    // let perPage = req.query.perPa ge || 50;
    // let page = req.query.page >= 1 ? req.query.page - 1 : 0;
    let Chats = await messageModel.find({ $or: [{recipient_id:id_user},{ sender_id: id_user }] })
    let temp_ar=[...Chats]
    let limit_ar=temp_ar.splice(temp_ar.length-50,temp_ar.length);
    // .limit(perPage)
    // .skip(perPage*page)
    res.json(limit_ar)
})
// find all user thet sended message  
router.get("/all",authAdmin, async (req, res) => {
    let message = await messageModel.find({})
    let ar=[];
    ar =[... new Set(message.map(data => data.sender_id))]
    res.json(ar)
})

router.post("/:id", auth,async (req, res) => {
    let validBody = validateMessage(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        let message = new messageModel(req.body); 
        let _recipient_id = req.params.id;
        let id = req.userToken.id
        let user = await UserModel.findOne({ _id: id })       
        let ar = [...user.message, message._id]
        let userUpdate = await UserModel.updateOne({ _id: id }, { message: ar })
        message.sender_id = id
        message.recipient_id = _recipient_id
        await message.save();
        res.json({ message, userUpdate })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Something Worng , come back later" })
    }
})

router.delete("/:idDelete", authAdmin , async(req,res) => {
    try{
    let idDelete = req.params.idDelete 
    let message=await messageModel.findOne({_id:idDelete})
    let id_user = message.sender_id;
    let user_item = await UserModel.findOne({ _id: id_user });

        let temp = [...user_item.message].filter(item => item != idDelete);
        //   console.log(temp);
        let dataUserListDel = await UserModel.updateOne({ _id: id_user }, { message: temp });
        let dataMessegDel = await messageModel.deleteOne({_id:idDelete}); 
        res.json({dataMessegDel,dataUserListDel});
    }
 

    catch(err){
      console.log(err);
      return res.status(500).json(err);
    }
  })


module.exports = router;