const isAuthentified = require('../../middlewares/authMiddleware.js')
const express = require("express")
const router = express.Router();
const Agenda = require("../../database/models/agenda.js")


router.get("/getDate",isAuthentified,async(req,res)=>{
    
    
})

module.exports = router