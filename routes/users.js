const express = require("express");
const { pick ,find, filter} = require("lodash");
const bcrypt = require("bcrypt");
const { UserModel, validateUser, validatelogin, genToken } = require("../models/userModel");
const { auth, authAdmin } = require("../middels/auth");
const { PostModel } = require("../models/postModel");
const { CommentModel } = require("../models/commentModel");


const router = express.Router();
// find all users
// URL/users/



router.get("/",auth, async (req, res) => {
  let perPage = req.query.perPage || 5;
  let page = req.query.page >= 1 ? req.query.page - 1 : 0;
  let data = await UserModel.find({}, { pass: 0 })
  .limit(perPage)
  .skip(page * perPage)
  
  res.json(data)
})

router.get("/all_users", async (req, res) => {
  let data = await UserModel.find({}, { pass: 0 })

  res.json(data)
})

// check if the user have a token 
router.get("/checkToken",auth, async (req, res) => {
   res.json(true)
})
// //URL/users/userInfo/ for one user by id
router.get("/userInfo/:userId",auth, async (req, res) => {
  let userId=req.params.userId;
  try {
  let data = await UserModel.findOne({_id:userId}, { pass: 0 })
  res.json(data)
} catch (err) {
  console.log(err);
  res.status(500).json({ msg: "Something went Wrong, come back later" })
}
})

//URL/users/userInfo/ for one user
router.get("/userInfo/",auth, async (req, res) => {
  let id=req.userToken.id
  try {
  let data = await UserModel.findOne({_id:id}, { pass: 0 })
  res.json(data)
} catch (err) {
  console.log(err);
  res.status(500).json({ msg: "Something Worng , come back later" })
}
})


// URL/users/
// creat route for new user //register
router.post("/", async (req, res) => {
  // console.log(req.body);
  let validBody = validateUser(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = new UserModel(req.body);
    user.pass = await bcrypt.hash(req.body.pass, 10)
    await user.save();
    let userObj = pick(user, ["_id", "name", "email", "role", "adress", "phone"])
    res.json(userObj)
  } catch (err) {
    if (err.code == 11000) {
      return res.status(400).json({ err: "Email already in system , try login" })
    }
    console.log(err);
    res.status(500).json({ msg: "Something Worng , come back later" })
  }
})
//URL/users//login
router.post("/login", async (req, res) => {
  let validBody = validatelogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = await UserModel.findOne({ email: req.body.email })
    if (!user) {
      return res.status(401).json({ msg: "Email or Password Worng 333" })
    }
    let pass = await bcrypt.compare(req.body.pass, user.pass)
    if (!pass) {
      return res.status(401).json({ msg: "Email or Password Worng 222" })
    }
    let newToken = genToken(user._id,user.role);
    res.json({ token: newToken,role:user.role })
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Something Worng , come back later" })
  }

})
// Update for user
// URL/users/edit
router.put("/edit",auth, async (req, res) => {
  // let id = req.params.idEdit
  let validBody = validateUser(req.body);
  if (validBody.error) {
      return res.status(400).json(validBody.error.details);
  }
  try {
      let token_id=req.userToken.id;
      // console.log(token_id);
      let updateData = await UserModel.updateOne({ _id: token_id}, req.body)
      res.status(200).json(updateData);
  } catch (err) {
      console.log(err);
      res.status(400).send(err);
  }

})

//add followers to the corrcet user
router.put("/addfollowers",auth, async (req, res) => {
  try {
      let token_id=req.userToken.id;
      let follow=req.body.followers;
      let flag=false;
      let flagI=false;
      if(follow==token_id){
        flagI=true
        res.status(200).json({flagI});
      }else{
       let user = await UserModel.findOne({ _id: token_id})
        let index;
       user.followers.forEach((item,i) => {
          if(item==follow){
            flag=true
            index=i
          } 
        });
      if(flag){
        let newFollow=user.followers.filter((item)=>{
            item!=follow
        });
        let userUpdate=await UserModel.updateOne({_id: token_id},{followers:newFollow})
        res.status(200).json({userUpdate ,flag , flagI});
      }else{
        let newFollow=[...user.followers,...follow];
        let userUpdate=await UserModel.updateOne({_id: token_id},{followers:newFollow})
      
        res.status(200).json({userUpdate ,flag , flagI});
      }
    } 
  } catch (err) {
      console.log(err);
      res.status(400).send(err);
  }

}) 
router.get("/followers/:id_userFollow", auth, async (req, res) => {
  let id = req.params.id_userFollow;
  let user_id = req.userToken.id;
  //  console.log(id);
  try {
    let flag=false;
    if(id==user_id){
      flag=true 
    }else{
       let user= await UserModel.findOne({ _id: user_id })
      user.followers.forEach((item,i) => {
        if(item==id){
          flag=true              
        }      
      }); 
    }
  
      // console.log(flag); 
      res.json(flag)

  } catch (error) {
      res.json(error)
  }
})

// router.get("/ifI/:id_userFollow", auth, async (req, res) => {
//   let id = req.params.id_userFollow;
//   let user_id = req.userToken.id;
//   //  console.log(id);
//   try {
//     let flag=false;
//         if(id==user_id){
//           flag=true              
//         }       
//     res.json(flag)

//   } catch (error) {
//       res.json(error)
//   }
// })

// get amount  for pagenaition
router.get("/amount", async(req,res) => {
  try{
    let data = await UserModel.countDocuments();
    res.json({amount:data});
  }
  catch(err){
    console.log(err)
    res.status(500).json(err)
  }
})

// change rule for admin only
router.patch("/changeRole/:userId/:role", authAdmin, async (req, res) => {
  let userId=req.params.userId;
  let role=req.params.role;
  try{
    if(userId!=req.tokenData.id&&userId!="6239d37e4781a3fedb04950a"){
      let data= await UserModel.updateOne({ _id: userId },{role:role})
      res.json(data)
    }else{
      res.status(401).json({err:"you cant change your self or the super user"})
    }   
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Something Worng , come back later" })
  }
})

// Deleting a user and his posts end messgest
router.delete("/:idDelete", authAdmin , async(req,res) => {
  try{
    let idDelete = req.params.idDelete 
    let dataPostDel = await PostModel.deleteMany({user_id:idDelete})
    let dataCommentDel = await CommentModel.deleteMany({user_id:idDelete})
    // let dataMessegDel = await MessegModel.deleteOne({user_id:idDelete}); 
     let dataUserDel = await UserModel.deleteOne({_id:idDelete});  
    res.json({dataPostDel,dataCommentDel,dataUserDel});
  }
  catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
})

module.exports = router;



