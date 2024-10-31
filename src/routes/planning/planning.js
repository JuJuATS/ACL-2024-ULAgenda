const authMiddleware = require('../../middlewares/authMiddleware.js')
const express = require("express")
const router = express.Router();



router.get("/",authMiddleware,(req,res)=>{

    res.render("planning",{user:req.user.id});
    
})

module.exports = router