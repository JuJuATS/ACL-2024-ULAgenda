const express = require('express');
const Rdv = require('../../database/models/rdv.js');
const authMiddleware = require('../../middlewares/authMiddleware.js');
const { checkAgendaAccess, checkModifyRights } = require('../../middlewares/agendaAccessMiddleware.js');
const ObjectId = require('mongodb').ObjectId;
const router = express.Router();
const Recurrence = require("../../database/models/recurrence");
const Preset = require('../../database/models/preset.js');
const Rappel = require('../../database/models/rappel.js');

// Route pour afficher les rendez-vous
router.get('/', authMiddleware, checkAgendaAccess, async (req, res) => {
  try {
    const presets = await Preset.find({ userId: req.user.id });
    res.render('rendezvous', {
      user: req.user.id,
      agenda: req.agenda._id,
      agendaObj : req.agenda,
      presets,
      accessLevel: req.accessLevel  // Passer le niveau d'accès à la vue
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).send('Erreur serveur');
  }
});

// Route pour obtenir les récurrences via l'API
router.get('/api/recurrence', authMiddleware, checkAgendaAccess, async (req, res) => {
  try {
    const rdvUser = await Rdv.find({ agendaId: req.agenda._id })
    rdvUser.sort((a, b) => {
      const dateA = new Date(a.dateDebut);
      const dateB = new Date(b.dateDebut);
      return dateA - dateB;
    });

    const rdvs = await Promise.all(rdvUser.map(async (rdv) => {
      const rec = await Recurrence.findById(rdv.recurrences);
      return { "recurrence": rec, ...rdv.toObject() };
    }));

    res.status(200).json({ rdvs: rdvs });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour créer un nouveau rendez-vous
router.post('/', authMiddleware, checkAgendaAccess, checkModifyRights, async (req, res) => {


  try {
    const { name, description, dateDebut, dateFin, recurrences, finRecurrence,backgroundColor,priority,rappel } = req.body;

    if (!name || !dateDebut || !dateFin) {
      return res.status(400).json({ message: "Les champs 'name', 'dateDebut', 'dateFin' sont obligatoires." });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (fin <= debut) {
      return res.status(400).json({ message: "La date de fin doit être après la date de début." });
    }

    const rappelEntity = rappel === 0 ? null : new Rappel({duree:rappel,envoye:false});

    const recurrence = new Recurrence({
      yearDay: recurrences["year"],
      monthDay: recurrences["month"],
      weekDay: recurrences["week"],
      dateDebut: debut,
      dateFin:finRecurrence ? new Date(finRecurrence) : null,
    });

    const newRdv = new Rdv({
      name: name,
      description: description,
      dateDebut: debut,
      dateFin: fin,
      agendaId:req.agenda,
      recurrences: recurrence,
      rappel:rappelEntity,
      priority:priority,
      color:backgroundColor
    });
    rappelEntity !== null ? await rappelEntity.save() : null;
    await recurrence.save();
    await newRdv.save();

    req.agenda.rdvs.push(newRdv._id);
    await req.agenda.save();

    res.status(201).json({ ok: true, rdv: newRdv });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur lors de la création du rendez-vous.", error });
  }
});

// Route pour modifier un rendez-vous
router.put('/:id', authMiddleware, checkAgendaAccess, checkModifyRights, async (req, res) => {
  try {
    const rdvId = req.params.id;
    const { name, description, dateDebut, dateFin, recId, recurrences, finRecurrence,backgroundColor,priority,rappel } = req.body;

    if (!name || !dateDebut || !dateFin) {
      return res.status(400).json({ message: "Les champs requis sont manquants." });
    }
    const rdv = await Rdv.findById(rdvId);
    if (!rdv || !rdv.agendaId.equals(req.agenda._id)) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }
    if(recId){
      const rec = await Recurrence.findById(recId);
      if (!rec) {
        return res.status(404).json({ message: "Récurrence non trouvée" });
      }
      // Mise à jour de la récurrence
    if(Object.keys(recurrences).length !==0){
      Object.assign(rec, {
        yearDay: recurrences.year,
        monthDay: recurrences.month,
        weekDay: recurrences.week,
        dateFin: finRecurrence,
        dateDebut: new Date(dateDebut)
      });
    }
    await rec.save();
    }

    let rappelEntity = await Rappel.findByIdAndDelete(rdv.rappel);

    if(!rappel && rappel !==0 ){
      rappelEntity = new Rappel({duree:rappel,envoye:false});
      rappelEntity.save();
      rdv.rappel = rappelEntity
    }
    // Mise à jour du rendez-vous
    Object.assign(rdv, {
      name,
      description,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      priority:priority,
      color:backgroundColor
    });


    await rdv.save();

    res.status(200).json({ ok: true, rdv });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur lors de la modification du rendez-vous", error });
  }
});

// Route pour supprimer un rendez-vous
router.delete('/:ids', authMiddleware, checkAgendaAccess, checkModifyRights, async (req, res) => {
  try {
    const rdvId = req.params.ids;
    const rdv = await Rdv.findById(rdvId);

    if (!rdv || !rdv.agendaId.equals(req.agenda._id)) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    await Rdv.findByIdAndDelete(rdvId);
    res.status(200).json({ ok: true, message: "Rendez-vous supprimé correctement" });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur lors de la suppression du rendez-vous", error });
  }
});

// Route pour éditer un rendez-vous (affichage du formulaire)
router.get('/edit/:id', authMiddleware, checkAgendaAccess, checkModifyRights, async (req, res) => {
  try {
    const rdvId = req.params.id;
    const rendezvous = await Rdv.findById(rdvId);

    if (!rendezvous || !rendezvous.agendaId.equals(req.agenda._id)) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    const rec = await Recurrence.findById(rendezvous.recurrences);
    const rappel = await Rappel.findById(rendezvous.rappel);
    const { yearDay, weekDay, monthDay, dateFin } = rec;

    res.render('modifier_rendezvous', {
      rendezvous,
      rec: { yearDay, weekDay, monthDay, dateFin },
      recIdd: rec.id,
      accessLevel: req.accessLevel,
      rappel :rappel
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur interne du serveur", error });
  }
});


module.exports = router;
