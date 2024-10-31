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
    let userId = ObjectId.createFromTime(req.session.id);  
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

// Route to update a specific rendezvous
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const rdvId = req.params.id;
        const { name, description, dateDebut, dateFin } = req.body;

        if (!name || !dateDebut || !dateFin) {
            return res.status(400).json({ message: "Fields 'name', 'dateDebut', 'dateFin' are required." });
        }

        const rdv = await Rdv.findById(rdvId);
        if (!rdv) {
            return res.status(404).json({ message: "Rendezvous not found" });
        }

        rdv.name = name;
        rdv.description = description;
        rdv.dateDebut = new Date(dateDebut);
        rdv.dateFin = new Date(dateFin);

        await rdv.save();
        res.status(200).json({ ok: true, rdv });
    } catch (error) {
        console.error("Error updating rendezvous:", error);
        res.status(500).json({ message: "Error updating rendezvous", error });
    }
});

// Route to delete a specific rendezvous
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const rdvId = req.params.id;

        const rdv = await Rdv.findByIdAndDelete(rdvId);
        if (!rdv) {
            return res.status(404).json({ message: "Rendezvous not found" });
        }

        res.status(200).json({ ok: true, message: "Rendezvous deleted successfully" });
    } catch (error) {
        console.error("Error deleting rendezvous:", error);
        res.status(500).json({ message: "Error deleting rendezvous", error });
    }
});
// Route to render the edit rendezvous page
router.get('/edit/:id', authMiddleware, async (req, res) => {
  try {
      const rdvId = req.params.id;
      const rendezvous = await Rdv.findById(rdvId);
      
      if (!rendezvous) {
          return res.status(404).json({ message: "Rendez-vous non trouvé" });
      }

      res.render('modifier_rendezvous', { rendezvous });
  } catch (error) {
      console.error("Erreur lors de la récupération du rendez-vous:", error);
      res.status(500).json({ message: "Erreur interne du serveur", error });
  }
});
