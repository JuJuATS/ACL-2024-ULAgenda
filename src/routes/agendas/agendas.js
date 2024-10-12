const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const agendas = [
      
    ];
  
    res.render('agendas', { agendas });
});

router.post('/', async (req, res) => {
    try {
      const { name } = req.body;
      const newAgenda = new Agenda({ name });
  
      await newAgenda.save();
  
      res.status(201).json(newAgenda);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'agenda", error });
    }
});

module.exports = router;