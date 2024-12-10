const isAuthentified = require('../../middlewares/authMiddleware.js')
const express = require("express")
const router = express.Router();
const Agenda = require("../../database/models/agenda.js")


router.get("/getRdv",isAuthentified,async(req,res)=>{
    const userId = req.user?.id
  
    const {agenda} = req.query
    const stringAgenda = decodeURIComponent(agenda)
    if(stringAgenda === ""){
        res.send({event:[]})
    }
})

module.exports = router