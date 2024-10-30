const express = require('express');
const isAuthentified = require('../middlewares/authMiddleware');
const { getPresetInfosById } = require('../routes/presets');
const Agenda = require("../database/models/agenda")

const apiRouter = express.Router();

// Route pour récupérer les informations d'un preset à partir de son id
apiRouter.get('/presets/:id', isAuthentified, getPresetInfosById);
apiRouter.get("/getAgenda",isAuthentified,async(req,res)=>{

    let userId = req.user.id;
  
    const agendas = await Agenda.find({userId:userId});
      
      res.status(200).send(agendas);
  })
apiRouter.get("/getDate",isAuthentified,async(req,res)=>{
    const userId = req.user?.id

    const {agenda} = req.query
    const stringAgenda = decodeURIComponent(agenda)
    console.log(JSON.parse(stringAgenda))

    if(stringAgenda === ""){  
      res.send({event:[]})
    }
})
module.exports = apiRouter;
