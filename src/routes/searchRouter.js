const express = require('express');
const router = express.Router();
const Agenda = require('../database/models/agenda');
const isAuthenticated = require('../middlewares/authMiddleware');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Récupérer tous les agendas de l'utilisateur avec les rendez-vous peuplés
        const agendas = await Agenda.find({ userId: req.user.id })
                                    .populate('rdvs');
        
        // Extraire tous les rendez-vous des agendas
        const rdvs = agendas.reduce((acc, agenda) => {
            return acc.concat(agenda.rdvs.map(rdv => ({
                ...rdv.toObject(),
                agendaName: agenda.name
            })));
        }, []);

        res.render('search', { rdvs });
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
