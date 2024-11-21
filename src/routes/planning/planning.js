const authMiddleware = require('../../middlewares/authMiddleware.js')
const express = require("express")
const router = express.Router();
const Preset = require("../../database/models/preset.js")
const Agenda = require("../../database/models/agenda.js");
const Share = require('../../database/models/share.js');

router.get("/",authMiddleware,async(req,res)=>{
    const presets = await Preset.find({ userId: req.user.id });
    const agendas = await Agenda.find({userId:req.user.id});
    const partages = await Share.find({sharedWith:req.user.id}).populate("agendaId");
    partages.forEach(partage=>agendas.push(partage.agendaId))
    res.render("planning",{user:req.user.id,presets:presets,agendas:agendas});
})

module.exports = router