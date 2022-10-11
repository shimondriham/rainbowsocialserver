const express = require("express");
const { sendEmail } = require("../middels/sendMail");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "Email route work" })
})

router.post("/", async (req, res) => {
  try {
    if (req.body.email?.length < 3 || req.body.name?.length < 2 || req.body.subject?.length < 3) {
      return res.status(400).json({ msg_err: "You must send valid name ,subject and email 1111" });
    }
    if(await sendEmail(req.body)){
      res.json({ msg: "email sended", status: "ok" })
    }
    else{
      return res.status(400).json({ msg_err: "You must send valid name ,subject and email 444"  });
    }
  }
  catch(err){
    console.log(err);
    return res.status(400).json({ msg_err: "You must send valid name ,subject and email 222"  });
  }
})
module.exports = router;
