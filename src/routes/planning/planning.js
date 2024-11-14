const authMiddleware = require('../../middlewares/authMiddleware.js')
const express = require("express")
const router = express.Router();
const Preset = require("../../database/models/preset.js")
const Agenda = require("../../database/models/agenda.js")

router.get("/",authMiddleware,async(req,res)=>{
    const presets = await Preset.find({ userId: req.user.id });
    const agendas = await Agenda.find({userId:req.user.id});
    res.render("planning",{user:req.user.id,presets:presets,agendas:agendas});
})

module.exports = router