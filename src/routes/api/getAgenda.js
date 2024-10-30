const authMiddleware = require('../../middlewares/authMiddleware.js')
const express = require("express")
const router = express.Router();
const Agenda = require("../../database/models/agenda.js")


router.get("/getAgenda",authMiddleware,async(req,res)=>{

  let userId = req.session.userId;

  const agendas = await Agenda.find({userId:userId});
    
    res.status(200).send(agendas);
})

module.exports = router