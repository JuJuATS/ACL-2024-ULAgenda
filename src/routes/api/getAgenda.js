const authMiddleware = require('../../middlewares/authMiddleware.js')
const express = require("express")
const router = express.Router();
const Agenda = require("../../database/models/agenda.js")


router.get("/getAgenda",authMiddleware,async(req,res)=>{

  const agendas = await Agenda.find({userId:req.user.id});
  const partages = await Share.find({sharedWith:req.user.id,shareType:"user",$or: [{permission:"contribute" }, { permission: "admin" }]}).populate("agendaId")
  partages.forEach(partage=>agendas.push(partage.agendaId))
    res.status(200).send(agendas);
})

module.exports = router