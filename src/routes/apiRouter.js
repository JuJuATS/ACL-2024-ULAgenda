const express = require('express');
const isAuthentified = require('../middlewares/authMiddleware');
const Agenda = require('../database/models/agenda');
const { getPresetInfosById } = require('../routes/presets');
const Fuse = require('fuse.js');
const RDV = require("../database/models/rdv")
const apiRouter = express.Router();
const mongoose = require("mongoose")
const recurrence = require("../database/models/recurrence")
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

apiRouter.get("/getAgenda",isAuthentified,async(req,res)=>{
  let userId = req.user.id;
  const agendas = await Agenda.find({userId:userId});
  res.status(200).send(agendas);
})


const getAgendaEvents = async (req, res, next) => {
  const { agenda } = req.query;
  if (!agenda) {
    return res.status(400).json({ 
      error: 'Le paramètre agenda est requis',
      event: []
    });
  }
  const decodedAgenda = decodeURIComponent(agenda);
  // Décodage et parsing de l'agenda
  if (decodedAgenda === "") {
    return res.status(200).json({ event: [] });
  }
  

  try {
    // Vérification de l'authentification
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        error: 'Utilisateur non authentifié',
        event: []
      });
    }
    // Récupération des rendez-vous avec projection optimisée
    console.log(decodedAgenda)
    let events = await RDV.find({agendaId:decodedAgenda})
    console.log(events)
   
    events = events.map(async el=>{
      
      let rdv = {
        id:el._id,
        start:el.dateDebut,
        end:el.dateFin,
        extendedProps: {
          description: el.description
      },
        title:el.name,
        duration:el.dateFin-el.dateDebut
      }
      if(el.recurrences){
          console.log("il y a une recurrence")
          const recurrenceRdv = await recurrence.findById(el.recurrences._id);
        
         if(recurrenceRdv!==null){
          if(recurrenceRdv.yearDay.length !== 0){
            console.log("il ya une recurrence par année")
            let dateDebut = new Date(recurrenceRdv.dateDebut)
            dateDebut.setDate(dateDebut.getDate() + 1)
             rdv.rrule={
              freq:YEARLY,
              byyearday:recurrenceRdv.yearDay,
              dtstart:el.dateDebut,
              until:recurrenceRdv.dateFin
            }
          } 
          if(recurrenceRdv.monthDay.length !==0){
            console.log("il ya une recurrence par mois")
            let dateDebut = new Date(recurrenceRdv.dateDebut)
            dateDebut.setDate(dateDebut.getDate() + 1)
              rdv.rrule={
                freq:MONTHLY,
                bymonth:recurrenceRdv.monthDay,
                dtstart:el.dateDebut,
                until:recurrenceRdv.dateFin
              }
            } 
          if(recurrenceRdv.weekDay.length !==0){
            console.log("il ya une recurrence par jour")
            let dateDebut = new Date(recurrenceRdv.dateDebut)
            dateDebut.setDate(dateDebut.getDate() + 1)
              rdv.rrule={
                freq:weekDay,
                bymonth:recurrenceRdv.weekDay,
                dtstart:el.dateDebut,
                until:el.dateFin
              }
            
            }
          }
         }
          
          return rdv
       
      }
    )
    // Envoi de la réponse
    res.status(200).json({ 
      event: events
    });

  } catch (error) {
    // Log de l'erreur pour monitoring
    console.error('Erreur lors de la récupération des événements:', error);
    
    next(error);
  }
};
apiRouter.get("/getDate",isAuthentified,getAgendaEvents)


module.exports = apiRouter;
