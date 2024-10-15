const express = require('express');
const Agenda = require('../../database/models/agenda.js');
const authMiddleware = require('../../middlewares/authMiddleware.js')
const router = express.Router();

// Route pour afficher les agendas
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.session.id;
  const agendas = await Agenda.find({ userId });

  res.render('agendas' ,{ agendas });
});

// Route pour créer un nouvel agenda
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.session.id;

    if (!name) {
      return res.status(400).json({ message: 'Le nom de l\'agenda est requis' });
    }

    const newAgenda = new Agenda({ name, userId });
    await newAgenda.save();

    res.status(201).json(newAgenda);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'agenda", error });
  }
});

module.exports = router;