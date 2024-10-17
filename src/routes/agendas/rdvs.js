const express = require('express');
const Rdv = (require('../../database/models/rdv.js')).Rdv;
const authMiddleware = require('../../middlewares/authMiddleware.js');
const ObjectId = require('mongodb').ObjectId;
const router = express.Router();
const Agenda = require("../../database/models/agenda.js")

// Route pour afficher les rendez-vous avec le bon id.

router.get('/', authMiddleware, async (req, res) => {
  const {agendaId} = req.query
  const rdvUser = await Rdv.find({agendaId:agendaId})
  rdvUser.sort((a, b) => {
    const dateA = new Date(`${a.dateDebut}`);
    const dateB = new Date(`${b.dateDebut}`);
    return dateA - dateB;  // Sort ascending by date and start time
});
  res.render('rendezvous', { rdvUser:rdvUser,agenda:agendaId });
});



// Route pour créer un nouveau rendez-vous.
router.post('/', authMiddleware, async (req, res) => {
  try {
    
    const { name, description, dateDebut, dateFin,agendaId } = req.body;
    console.log(name,description,dateDebut,dateFin,agendaId)
    if (!name || !dateDebut || !dateFin || !agendaId) {
      console.log("il manque quelque chose")
      return res.status(400).json({ message: "Les champs 'name', 'dateDebut', 'dateFin' sont obligatoires." });
    }
    let userId = req.session.userId;
    const agenda = await Agenda.findOne({_id:agendaId});
    
    if (!agenda) {
      console.log("pas d'agenda")
      return res.status(404).json({ message: 'Agenda non trouvé' });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    

    if (fin <= debut) {
      console.log("date pas valide")
      return res.status(400).json({ message: "La date de fin doit être après la date de début." });
    }

    const newRdv = new Rdv({
      name:name,
      description:description,
      dateDebut: debut,
      dateFin: fin,
      agendaId:agendaId
    });
   
    agenda.rdvs.push(newRdv);
    newRdv.save();
    agenda.save();
    res.status(201).json({ok:true,rdv:newRdv});
  } catch (error) {
    console.log("il y a une erreur")
    console.log(error)
    res.status(500).json({ message: "Erreur lors de la création du rendez-vous.", error });
  }
});

module.exports = router;