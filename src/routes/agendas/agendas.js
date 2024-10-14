const express = require('express');
const Agenda = require('../../database/models/agenda.js');
const router = express.Router();

// Route pour afficher les agendas
router.get('/', (req, res) => {
  const agendas = [
  ];

  res.render('agendas', { agendas });
});

// Route pour créer un nouvel agenda
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    console.log("le nom récupéré est : " + name);

    const newAgenda = new Agenda({ name, rdvs: [] });

    await newAgenda.save();

    res.status(201).json(newAgenda);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'agenda", error });
  }
});

module.exports = router;