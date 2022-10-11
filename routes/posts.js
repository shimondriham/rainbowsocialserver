const express = require("express");
const { random, filter } = require("lodash");
const { auth, authAdmin } = require("../middels/auth");
const { CommentModel } = require("../models/commentModel");
const { validatePost, PostModel } = require("../models/postModel");
const { UserModel } = require("../models/userModel");
const router = express.Router();

// router.get("/postInfo/:id", async (req, res) => {
//     let id = req.params.shortId;    
//     let posts = await PostModel.findOne({_id:id})
//     res.json(posts)
// })

router.get("/", async (req, res) => {
    let perPage = req.query.perPage || 5;
    let page = req.query.page >= 1 ? req.query.page - 1 : 0;
    let posts = await PostModel.find({})
        .limit(perPage)
        .skip(page * perPage)
    res.json(posts)
})
router.get("/all", async (req, res) => {
    // let perPage = req.query.perPage || 5;
    // let page = req.query.page >= 1 ? req.query.page - 1 : 0;
    let posts = await PostModel.find({})
    // .limit(perPage)
    // .skip(page * perPage)
    res.json(posts)
})


router.get("/myFeed", auth, async (req, res) => {
    try {
        let token_id = req.userToken.id
        let ar = [];
        // let cunter = 0
        let user = await UserModel.findOne({ _id: token_id })
        let posts = await PostModel.find({})
        posts.forEach((itemP, i) => {
            user.followers.forEach((itemF, i) => {
                if (itemP.user_id == itemF) {
                    // cunter += 1 ;
                    ar = [...ar, { ...itemP._doc }];
                }
            });
        });

        console.log(ar);
        res.json(ar)
    } catch (error) {
        res.json(error)
    }
})


// route for get info about one post
router.get("/post-info/:id_post", async (req, res) => {
    let id = req.params.id_post;
    try {
        let posts = await PostModel.findOne({ _id: id })
        res.json(posts)
    } catch (error) {
        res.json(error)
    }
})
router.get("/likes/:id_post", auth, async (req, res) => {
    let id = req.params.id_post;
    let user_id = req.userToken.id;
    try {
        let { likes } = await PostModel.findOne({ _id: id })


        res.json(likes.includes(user_id))

    } catch (error) {
        res.json(error)
    }
})
router.patch("/likes/:id_post", auth, async (req, res) => {
    let id = req.params.id_post;
    let user_id = req.userToken.id;
    try {
        let { likes } = await PostModel.findOne({ _id: id })
        let temp
        if (!likes.includes(user_id)) {
            temp = [...likes, user_id]
            console.log(temp);
        } else (temp = likes.filter(item => item !== user_id))
        let data = await PostModel.updateOne({ _id: id }, { likes: temp })
        res.json({ data, likes: temp, user_id: user_id })

    } catch (error) {
        res.json(error)
    }
})

// route for search about post by title or postMessage
router.get("/search", async (req, res) => {
    let search = req.query.s;
    let perPage = req.query.perPage || 5;
    let page = req.query.page >= 1 ? req.query.page - 1 : 0;
    let searchRegExp = new RegExp(search, "i")
    query = searchRegExp
    try {
        let posts = await PostModel.find({ $or: [{ title: query }, { postMessage: query }] }
        )
            .limit(perPage)
            .skip(perPage * page)
        res.json(posts)
    } catch (error) {
        res.json(error)
    }
})

// get amount  for pagenaition
router.get("/amount", async (req, res) => {
    try {
        let data = await PostModel.countDocuments();
        res.json({ amount: data });
    }
    catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

// update the likes in the current id that sended with params raq
router.put("/update_likes/:id_edit", auth, async (req, res) => {
    let user_id = req.userToken.id;
    let post_id = req.params.id_edit;
    try {
        // find the post and check if the user id include if true delete else unshift
        let post = await PostModel.findOne({ _id: post_id })
        let likes_ar = post.likes || []
        if (likes_ar.includes(user_id)) {
            likes_ar = likes_ar.filter(userId => userId !== user_id)
        } else {
            likes_ar.unshift(user_id)
        }
        let data = await PostModel.updateOne({ _id: post_id }, { likes: likes_ar })
        res.json(data)
    } catch (error) {
        console.log(error.details);
    }

})
// post for upload post user
router.post("/", auth, async (req, res) => {
    // console.log(req.body);
    let validBody = validatePost(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        // get generic short id and add to post 
        let post = new PostModel(req.body);
        let shortId = await genShortId();
        let id = req.userToken.id
        let user = await UserModel.findOne({ _id: id })
        post.short_id = shortId
        let ar = [...user.post, post._id]
        let userUpdate = await UserModel.updateOne({ _id: id }, { post: ar })
        post.user_id = id
        await post.save();
        res.json({ post, userUpdate })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Something Worng , come back later" })
    }
})

// Deleting a posts and his comments end updet in user
router.delete("/:idDelete", authAdmin, async (req, res) => {
    try {
        let idDelete = req.params.idDelete
        let dataCommentsDel = await CommentModel.deleteMany({ post_id: idDelete });
        let id_user = req.tokenData.id;
        let user_item = await UserModel.findOne({ _id: id_user });
        let new_ar = [...user_item.post]
        let temp = new_ar.filter(item => item != idDelete);
        //   console.log(temp);
        let dataUserListDel = await UserModel.updateOne({ _id: id_user }, { post: temp });
        // dataUserListDel not work 
        let dataPostDel = await PostModel.deleteOne({ short_id: idDelete });
        res.json({ dataUserListDel, dataPostDel, dataCommentsDel });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
})

module.exports = router;

// creat short id for post 
const genShortId = async () => {
    let flag = true;
    let rnd;
    while (flag) {
        rnd = random(0, 999999);
        try {
            let data = await PostModel.findOne(
                { short_id: rnd }
            )
            if (!data) flag = false;
        }
        catch (err) {
            console.log(err);
            res.status(400).send(err);
        }
    }
    return rnd
}




