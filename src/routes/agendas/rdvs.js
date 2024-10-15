const express = require('express');
const Rdv = (require('../../database/models/rdv.js')).Rdv;
const authMiddleware = require('../../middlewares/authMiddleware.js')
const router = express.Router();

// Route pour afficher les rendez-vous avec le bon id.
/*
router.get('/:agendaId', authMiddleware, async (req, res) => {
  const userId = req.session.id;
  const rdvUser = await Rdv.find({ agendaId });

  res.render('rendezvous', { rdvUser });
});
*/

// Route pour créer un nouveau rendez-vous.
router.post('/:agendaId', authMiddleware, async (req, res) => {
  try {
    const agendaId = req.params.agendaId;
    const { name, description, dateDebut, dateFin, category } = req.body;

    if (!name || !dateDebut || !dateFin || !agendaId) {
      return res.status(400).json({ message: "Les champs 'name', 'dateDebut', 'dateFin' sont obligatoires." });
    }

    const agenda = await Agenda.findById(agendaId);
    
    if (!agenda) {
      return res.status(404).json({ message: 'Agenda non trouvé' });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (fin <= debut) {
      return res.status(400).json({ message: "La date de fin doit être après la date de début." });
    }

    const newRdv = new Rdv({
      name,
      description,
      dateDebut: debut,
      dateFin: fin,
      agendaId
    });

    agenda.rdvs.push(newRdv);

    res.status(201).json(newRdv);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création du rendez-vous.", error });
  }
});

module.exports = router;