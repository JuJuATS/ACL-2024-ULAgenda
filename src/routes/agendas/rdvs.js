const express = require('express');
const Rdv = require('../../database/models/rdv.js');
const authMiddleware = require('../../middlewares/authMiddleware.js');
const ObjectId = require('mongodb').ObjectId;
const router = express.Router();
const Recurrence = require("../../database/models/recurrence");
const Agenda = require("../../database/models/agenda.js");
const Preset = require('../../database/models/preset.js');

// Route pour afficher les rendez-vous avec le bon id.

router.get('/', authMiddleware, async (req, res) => {
  const {agendaId} = req.query
  const rdvUser = await Rdv.find({agendaId:agendaId})
  rdvUser.sort((a, b) => {
    const dateA = new Date(`${a.dateDebut}`);
    const dateB = new Date(`${b.dateDebut}`);
    return dateA - dateB;  // Sort ascending by date and start time
});

  const presets = await Preset.find({ userId: req.user.id });
  res.render('rendezvous', { rdvUser: rdvUser, agenda: agendaId, presets });
});



// Route pour créer un nouveau rendez-vous.
router.post('/', authMiddleware, async (req, res) => {
  try {

    const { name, description, dateDebut, dateFin, agendaId, recurrences, finRecurrence } = req.body;
    console.log(name,description,dateDebut,dateFin,agendaId)
    if (!name || !dateDebut || !dateFin || !agendaId || !(recurrences && finRecurrence)) {
      console.log("il manque quelque chose")
      return res.status(400).json({ message: "Les champs 'name', 'dateDebut', 'dateFin' sont obligatoires." });
    }
    let userId = req.user.id;
    const agenda = await Agenda.findById(agendaId);
    
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


    const recurrence = new Recurrence({
      yearDay: recurrences["year"] ,
      monthDay: recurrences["month"],
      weekDay: recurrences["week"],
      dateDebut: debut,
      dateFin: new Date(finRecurrence)
    });

    const newRdv = new Rdv({
      name:name,
      description:description,
      dateDebut: debut,
      dateFin: fin,
      agendaId:agendaId,
      recurrences: recurrence
    });

    await newRdv.save();
   
    agenda.rdvs.push(newRdv._id);

    await agenda.save();

    res.status(201).json({ok:true,rdv:newRdv});
  } catch (error) {
    console.log("il y a une erreur")
    console.log(error)
    res.status(500).json({ message: "Erreur lors de la création du rendez-vous.", error });
  }
});

module.exports = router;
