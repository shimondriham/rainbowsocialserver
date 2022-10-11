const jwt= require("jsonwebtoken");
const { config } = require("../config/secret");

exports.auth=(req,res,next)=>{
    let token = req.header("x-api-key");
    if(!token){
        return res.status(401).json({msg:"you must send token to this endpoint"})
    }
    try{
        let decode= jwt.verify(token,config.jwtSecret);
        req.userToken=decode;
        next()
    }catch(err){
        console.log(err);
        res.status(401).json({msg:"your token is invalid or expired"})

    }
}

// auth for admin
exports.authAdmin = (req,res,next) => {
    let token = req.header("x-api-key");
    if(!token){
      return res.status(401).json({err:"You must send token in header to this endpoint"})
    }
    try{
      let decodeToken = jwt.verify(token,config.jwtSecret);
   
      // check if user role is admin
      if(decodeToken.role == "admin"){
        req.tokenData = decodeToken;
        next();
      }
      else{
        return res.status(401).json({err:"You must be admin in this endpoint"})
      }  
    }
    catch(err){
      return res.status(401).json({err:"Token invalid (if you hacker) or expired"});
    }
  }