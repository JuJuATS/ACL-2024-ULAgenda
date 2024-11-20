const express = require('express');
const Rdv = require('../../database/models/rdv.js');
const authMiddleware = require('../../middlewares/authMiddleware.js');
const ObjectId = require('mongodb').ObjectId;
const router = express.Router();
const Recurrence = require("../../database/models/recurrence");
const Agenda = require("../../database/models/agenda.js");
const Preset = require('../../database/models/preset.js');

async function verifOwner(agendaId, userId) {
  console.log("Testing ownership..");

  const agenda = await Agenda.findById(agendaId);

  if (!agenda) {
    console.log("Agenda not found!")
    return false;
  }

  if (!new ObjectId(userId).equals(agenda.userId)) {
    console.log("Not agenda owner! ", userId, " != ", agenda.userId);
    return false;
  }

    console.log("Success");

    return true;
}

// Route pour afficher les rendez-vous avec le bon id.
router.get('/', authMiddleware, async (req, res) => {
  const {agendaId} = req.query;

  const isOwner = await verifOwner(agendaId, req.user.id);

  if (!isOwner) {
    return res.redirect('/agendas');
  }

  const presets = await Preset.find({ userId: req.user.id });
  res.render('rendezvous', { user: req.user.id, agenda: agendaId, presets });
});


router.get('/api/recurrence', authMiddleware, async (req, res) => {
  const {agendaId} = req.query
  const rdvUser = await Rdv.find({agendaId:agendaId})
  rdvUser.sort((a, b) => {
    const dateA = new Date(`${a.dateDebut}`);
    const dateB = new Date(`${b.dateDebut}`);
    return dateA - dateB;  // Sort ascending by date and start time
  });
  const rdvs = await Promise.all(rdvUser.map(async (rdv) => {
    const rec = await Recurrence.findById(rdv.recurrences);

    return {"recurrence": rec, ...rdv.toObject()};
  }))
  res.status(201).json({rdvs:rdvs});
});



// Route pour créer un nouveau rendez-vous.
router.post('/', authMiddleware, async (req, res) => {
  try {

    const { name, description, dateDebut, dateFin, agendaId, recurrences, finRecurrence, priorite } = req.body;
    if (!name || !dateDebut || !dateFin || !agendaId ) {
      console.log("il manque quelque chose")
      return res.status(400).json({ message: "Les champs 'name', 'dateDebut', 'dateFin' sont obligatoires." });
    }
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
      yearDay: recurrences["year"],
      monthDay: recurrences["month"],
      weekDay: recurrences["week"],
      dateDebut: debut,
      dateFin:finRecurrence ? new Date(finRecurrence) : null,
    });
     console.log()
    const newRdv = new Rdv({
      name:name,
      description:description,
      dateDebut: debut,
      dateFin: fin,
      agendaId:agendaId,
      recurrences: recurrence,
      priority:priorite
      
    });

    await recurrence.save();

    await newRdv.save();

    agenda.rdvs.push(newRdv._id);

    await agenda.save();

    res.status(201).json({ok:true, rdv:newRdv});
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Erreur lors de la création du rendez-vous.", error });
  }
});


router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const rdvId = req.params.id;
        const { name, description, dateDebut, dateFin, recId, recurrences, finRecurrence, priorite } = req.body;
        if (!name || !dateDebut || !dateFin) {
            return res.status(400).json({ message: "Fields 'name', 'dateDebut', 'dateFin' are required." });
        }

        const rdv = await Rdv.findById(rdvId);
        if (!rdv) {
            return res.status(404).json({ message: "Rendezvous not found" });
        }

        const rec = await Recurrence.findById(recId);
        if (!rec) {
            return res.status(404).json({ message: "Recurrence not found" });
        }

        rdv.name = name;
        rdv.description = description;
        rdv.dateDebut = new Date(dateDebut);
        rdv.dateFin = new Date(dateFin);
        rdv.priority= priorite;

        rec.yearDay = recurrences.year
        rec.monthDay = recurrences.month
        rec.weekDay = recurrences.week
        rec.dateDebut = new Date(dateDebut)
        rec.dateFin = finRecurrence ? new Date(finRecurrence) : null;
        
        await rec.save();

        await rdv.save();
        res.status(200).json({ ok: true, rdv });
    } catch (error) {
        console.error("Error updating rendezvous:", error);
        res.status(500).json({ message: "Error updating rendezvous", error });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const rdvId = req.params.id;
        const rdv = await Rdv.findByIdAndDelete(rdvId);
        const rec = await Recurrence.findByIdAndDelete(rdv.recurrences);
        if (!rdv) {
            return res.status(404).json({ message: "Rendezvous not found" });
        }

        res.status(200).json({ ok: true, message: "Rendez-vous supprimé correctement" });
    } catch (error) {
        console.error("Error deleting rendezvous:", error);
        res.status(500).json({ message: "Error deleting rendezvous", error });
    }
});

router.get('/edit/:id', authMiddleware, async (req, res) => {
  try {
      const rdvId = req.params.id;
      const rendezvous = await Rdv.findById(rdvId);

      if (!rendezvous) {
          return res.status(404).json({ message: "Rendez-vous non trouvé" });
      }
      const rec = await Recurrence.findById(rendezvous.recurrences);
      if(rec !== null){
        const {yearDay, weekDay, monthDay, dateFin} = rec
        yearDay.map(d => console.log(typeof d))
        res.render('modifier_rendezvous', { rendezvous: rendezvous, rec: {yearDay, weekDay, monthDay, dateFin}, recIdd: rec.id });
      }
      else{
        const yearDay = [], weekDay = [], monthDay = [], dateFin = "";
        res.render('modifier_rendezvous', { rendezvous: rendezvous,rec:{yearDay, weekDay, monthDay, dateFin},recIdd:null});
      }
  } catch (error) {
      console.error("Erreur lors de la récupération du rendez-vous:", error);
      res.status(500).json({ message: "Erreur interne du serveur", error });
  }
});



module.exports = router;
