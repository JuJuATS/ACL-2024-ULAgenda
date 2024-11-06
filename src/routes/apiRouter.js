const express = require('express');
const isAuthentified = require('../middlewares/authMiddleware');
const Agenda = require('../database/models/agenda');
const { getPresetInfosById } = require('../routes/presets');
const Fuse = require('fuse.js');
const RDV = require("../database/models/rdv")
const apiRouter = express.Router();

// Route pour récupérer les informations d'un preset à partir de son id
apiRouter.get('/presets/:id', isAuthentified, getPresetInfosById);

apiRouter.get('/search', isAuthentified, async (req, res) => {
    try {
        const searchTerm = req.query.term?.toLowerCase() || '';
        const dateDebut = req.query.dateDebut ? new Date(req.query.dateDebut) : null;
        const dateFin = req.query.dateFin ? new Date(req.query.dateFin) : null;
        const durationMin = req.query.durationMin ? parseInt(req.query.durationMin) : null;
        const durationMax = req.query.durationMax ? parseInt(req.query.durationMax) : null;
        const sortBy = req.query.sortBy ? req.query.sortBy.split(',') : [];
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

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
            const options = {
                keys: ['name', 'tags', 'description'],
                threshold: 0.3,
                includeScore: true
            };
            const fuse = new Fuse(allRdvs, options);
            filteredRdvs = fuse.search(searchTerm).map(result => result.item);
        }

        // Appliquer les filtres de date et durée
        filteredRdvs = filteredRdvs.filter(rdv => {
            const dateMatch = (!dateDebut || rdv.dateDebut >= dateDebut) &&
                            (!dateFin || rdv.dateFin <= dateFin);
            const durationMatch = (!durationMin || rdv.duration >= durationMin) &&
                                (!durationMax || rdv.duration <= durationMax);
            return dateMatch && durationMatch;
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

        // Calcul du total et on applique la pagination
        const total = filteredRdvs.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRdvs = filteredRdvs.slice(startIndex, endIndex);

        res.json({
            rdvs: paginatedRdvs,
            hasMore: endIndex < total,
        });
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


apiRouter.get("/getDate",isAuthentified,async(req,res)=>{
  const userId = req.user?.id

  const {agenda} = req.query
  console.log(agenda)
  const stringAgenda = decodeURIComponent(agenda)
  console.log(JSON.parse(stringAgenda))
  if(stringAgenda === ""){  
    res.send({event:[]})
  }
  const Rdvs = await RDV.find({_id:{$in:JSON.parse(stringAgenda)}}).select('name _id dateDebut dateFin recurrences description').cursor();
  
const event = []
for (let document = await cursor.next(); document != null; document = await cursor.next()) {
event.push({
  id:document._id
})
}
})
apiRouter.get("/getAgenda",isAuthentified,async(req,res)=>{

  let userId = req.session.userId;

  const agendas = await Agenda.find({userId:userId});
    
    res.status(200).send(agendas);
})
module.exports = apiRouter;
