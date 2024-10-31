const express = require('express');
const isAuthentified = require('../middlewares/authMiddleware');
const { getPresetInfosById } = require('../routes/presets');
const Agenda = require("../database/models/agenda")
const RDV = require("../database/models/rdv")
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
    console.log(agenda)
    const stringAgenda = decodeURIComponent(agenda)
    console.log(JSON.parse(stringAgenda))
    if(stringAgenda === ""){  
      res.send({event:[]})
    }
    const Rdvs = await RDV.find({_id:{$in:JSON.parse(stringAgenda)}}).select('name _id dateDebut dateFin recurrences description').cursor();
    
const event = []
for (let document = await cursor.next(); document != null; document = await cursor.next()) {
  event.push({
    id:document._id
  })
}
})
module.exports = apiRouter;
