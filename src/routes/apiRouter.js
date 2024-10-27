const express = require('express');
const isAuthentified = require('../middlewares/authMiddleware');
const Agenda = require('../database/models/agenda');
const { getPresetInfosById } = require('../routes/presets');
const Fuse = require('fuse.js');

const apiRouter = express.Router();

// Route pour récupérer les informations d'un preset à partir de son id
apiRouter.get('/presets/:id', isAuthentified, getPresetInfosById);

apiRouter.get('/search', isAuthentified, async (req, res) => {
    try {
        const searchTerm = req.query.term?.toLowerCase() || '';
        const dateDebut = req.query.dateDebut ? new Date(req.query.dateDebut) : null;
        const dateFin = req.query.dateFin ? new Date(req.query.dateFin) : null;
        const sortBy = req.query.sortBy ? req.query.sortBy.split(',') : []; // ['criteria:order', ...]

        // Récupérer les agendas avec les rendez-vous
        const agendas = await Agenda.find({ userId: req.user.id })
                                  .populate('rdvs');

        // Filtrer et formater les rendez-vous
        let allRdvs = agendas.reduce((acc, agenda) => {
            const rdvs = agenda.rdvs.map(rdv => ({
                ...rdv.toObject(),
                agendaName: agenda.name
            }));
            return acc.concat(rdvs);
        }, []);

        let filteredRdvs = allRdvs;

        if (searchTerm) {
            // Utilisation de Fuse.js pour la recherche
            const options = {
                keys: ['name', 'tags'],
                threshold: 0.3,
                includeScore: true
            };
            const fuse = new Fuse(allRdvs, options);
            filteredRdvs = fuse.search(searchTerm).map(result => result.item);
        }

        // Vérification de la plage de dates
        filteredRdvs = filteredRdvs.filter(rdv => {
            const dateMatch = (!dateDebut || rdv.dateDebut >= dateDebut) &&
                            (!dateFin || rdv.dateFin <= dateFin);
            return dateMatch;
        });

        // Association de valeurs numériques aux priorités
        const priorityValue = {
            'Basse': 1,
            'Moyenne': 2,
            'Haute': 3
        };

        // Appliquer le tri
        if (sortBy.length > 0) {
            filteredRdvs.sort((a, b) => {
                for (const criterion of sortBy) {
                    const [field, order] = criterion.split(':');
                    let comparison = 0;

                    switch (field) {
                        case 'priority':
                            comparison = priorityValue[a.priority] - priorityValue[b.priority];
                            break;
                        case 'duration':
                            comparison = a.duration - b.duration;
                            break;
                    }

                    if (order === 'desc') comparison = -comparison;

                    if (comparison !== 0) return comparison;
                }
                return 0;
            });
        }

        res.json(filteredRdvs);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = apiRouter;
