const express = require("express");
const { auth, authAdmin } = require("../middels/auth");
const { validateComment, CommentModel } = require("../models/commentModel");
const { PostModel } = require("../models/postModel");
const router = express.Router();

router.get("/", async(req,res) => {
    let data= await CommentModel.find({})
  res.json({data})
})

// get amount  for pagenaition
router.get("/amount/:id", async(req,res) => {
  let id = req.params.id
  try{
    let data = await PostModel.findOne({_id:id});
    res.json({amount:data});
  }
  catch(err){
    console.log(err)
    res.status(500).json(err)
  }
})

// by id post and option to page and perPage
router.get("/:id_post", async(req,res) => {
    let post_id=req.params.id_post;
    let perPage = req.query.perPage || 1;
    let page = req.query.page >= 1 ? req.query.page - 1 : 0;
    page*=perPage;
    perPage+=page;
    let post=await PostModel.findOne({_id:post_id})
    let ar_comments=[...post.comments]
    // console.log(post.comments);
    let comments=await CommentModel.find({post_id:post_id})
    // let temp_ar=ar_comments.slice(page,perPage+1)
    res.json({ar_comments,comments})
  })
  
// new comment
router.post("/:_id_post",auth, async (req, res) => {
    // console.log(req.body);
    let validBody = validateComment(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        let comment = new CommentModel(req.body);
        let id_user = req.userToken.id;
        let id_post=req.params._id_post;
        let post = await PostModel.findOne({ _id: id_post })
        let ar = [...post.comments,comment._id]
        // console.log(ar);
        // console.log(post.comments);
        let postUpdate = await PostModel.updateOne({ _id: id_post }, { comments: ar })
        comment.post_id=id_post;
        comment.user_id=id_user;
        await comment.save();
        res.json({ comment ,postUpdate})
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: err })
    }
})

router.get("/likes/:id_comment", auth, async (req, res) => {
  let id = req.params.id_comment;
  let user_id = req.userToken.id;
  try {
      let { likes } = await CommentModel.findOne({ _id: id })
      res.json(likes.includes(user_id))
  } catch (error) {
      res.json(error)
  }
})

// update the likes in the current id that sended with params raq
router.patch("/likes/:id_edit", auth, async (req, res) => {
    let user_id = req.userToken.id;
    let comment_id = req.params.id_edit;
    try {
        // find the post and check if the user id include if true delete else unshift
        let comment = await CommentModel.findOne({ _id: comment_id })
        let likes_ar = comment.likes || []
        if (likes_ar.includes(user_id)) {
            likes_ar = likes_ar.filter(userId => userId !== user_id)
        } else {
            likes_ar.unshift(user_id)
        }
        let data = await CommentModel.updateOne({ _id: comment_id }, { likes: likes_ar })
        res.json({data,comment,likes_ar})
    } catch (error) {
        console.log(error);
    }

})
router.delete("/:idDelete", authAdmin , async(req,res) => {
    try{
      let idDelete = req.params.idDelete 
      let dataCommentsDel = await CommentModel.deleteOne({_id:idDelete});
    //   let id_user = req.tokenData.id ;
    //   let user_item = await UserModel.findOne({_id:id_user});
    //   let new_ar = [...user_item.post]
    //   let temp=new_ar.filter(item=> item != idDelete);
    // //   console.log(temp);
    //   let dataUserListDel = await UserModel.updateOne({ _id: id_user },{post:temp}); 
    // // dataUserListDel not work 
    //    let dataPostDel = await PostModel.deleteOne({short_id:idDelete});  
      res.json({dataCommentsDel});
    }
    catch(err){
      console.log(err);
      return res.status(500).json(err);
    }
  })

module.exports = router;