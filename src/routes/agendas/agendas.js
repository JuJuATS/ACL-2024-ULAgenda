const express = require('express');
const Agenda = require('../../database/models/agenda.js');
const ObjectId = require('mongodb').ObjectId;
const authMiddleware = require('../../middlewares/authMiddleware.js')
const router = express.Router();

// Route pour afficher les agendas
router.get('/', authMiddleware, async (req, res) => {

  /*let userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }*/

   let userId = ObjectId.createFromTime(req.session.id);  
  const agendas = await Agenda.find({userId:userId});

  res.render('agendas' ,{ agendas,user:req.session.isLoggedIn });
});

// Route pour supprimer un agenda par son ID
router.delete('/:id', async (req, res) => {
  try {
      const { id } = req.params; // Récupérer l'ID de l'agenda 
      const deletedAgenda = await Agenda.findByIdAndDelete(id); // récupère l'agenda de la BDD

      if (!deletedAgenda) {
          return res.status(404).json({ message: "Agenda non trouvé" });
      }

      res.status(200).json({ message: "Agenda supprimé avec succès" });
  } catch (error) {
      console.error('Erreur lors de la suppression de l\'agenda:', error);
      res.status(500).json({ message: "Erreur lors de la suppression de l'agenda", error });
  }
});

// Route pour créer un nouvel agenda
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = ObjectId.createFromTime(req.session.id);

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