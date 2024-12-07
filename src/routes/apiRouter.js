const express = require('express');
const isAuthentified = require('../middlewares/authMiddleware');
const Agenda = require('../database/models/agenda');
const { getPresetInfosById } = require('../routes/presets');
const Fuse = require('fuse.js');
const RDV = require("../database/models/rdv")
const apiRouter = express.Router();
const mongoose = require("mongoose")
const recurrence = require("../database/models/recurrence");
const Rappel = require('../database/models/rappel');
const Share = require('../database/models/share');
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
        const agendas = await Agenda.find({ userId: req.user.id }).populate('rdvs');

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

apiRouter.get("/getAgenda",isAuthentified,async(req,res)=>{
  let userId = req.user.id;

  const agendas = await Agenda.find({userId:userId});
  const partages = await Share.find({sharedWith:req.user.id,shareType:"user",$or: [{permission:"contribute" }, { permission: "admin" }]}).populate("agendaId")


  partages.forEach(partage=>{
    agendas.push(partage.agendaId);
  })
  res.status(200).send(agendas);
})


const getAgendaEvents = async (req, res, next) => {

  const { agenda,weekStart,weekEnd } = req.query;
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


    let events = await RDV.find({
      agendaId:decodedAgenda,dateDebut:{
        $gte: new Date(decodeURIComponent(weekStart)),
        $lte: new Date(decodeURIComponent(weekEnd))
      }
    })
    const partages = await Share.findOne({sharedWith:req.user.id,agendaId:decodedAgenda})

    events = await Promise.all(events.map(async el=>{

    const editable = partages ? partages.permission !== "read" : true;

      let rappel = await Rappel.findById(el.rappel);
      let rdv = {
        id:el._id,
        start:el.dateDebut,
        end:el.dateFin,
        backgroundColor:el.color,
        editable: editable,
        extendedProps: {
          description: el.description,
          link:`/rendezvous/edit/${el._id}`,
          agendaId:el.agendaId,
          recId:el.recurrences,
          rappel:rappel ? rappel.duree : 0,
          priorite:el.priority
      },
        title:el.name,
        duration:el.dateFin-el.dateDebut
      }

      if(el.recurrences){
          const recurrenceRdv = await recurrence.findById(el.recurrences);
          rdv.extendedProps = {...rdv.extendedProps,recurrences:recurrenceRdv}
         if(recurrenceRdv!=null){
          if(recurrenceRdv.yearDay.length!==0){

            let dateDebut = new Date(recurrenceRdv.dateDebut)
            dateDebut.setDate(dateDebut.getDate() - 1)
             rdv.rrule={
              freq:"yearly",
              byyearday:recurrenceRdv.yearDay,
              dtstart:dateDebut,
              until:recurrenceRdv.dateFin
            }
          }
          if(recurrenceRdv.monthDay.length!==0){

            let dateDebut = new Date(recurrenceRdv.dateDebut)
            dateDebut.setDate(dateDebut.getDate() - 1)
              rdv.rrule={
                freq:"monthly",
                bymonthday:recurrenceRdv.monthDay,
                dtstart:dateDebut,
                until:recurrenceRdv.dateFin
              }
            }
          if(recurrenceRdv.weekDay.length !==0){
            let dateDebut = new Date(recurrenceRdv.dateDebut)
            dateDebut.setDate(dateDebut.getDate() - 1)
              rdv.rrule={
                freq:"weekly",
                byweekday:recurrenceRdv.weekDay,
                dtstart:dateDebut,
                until:recurrenceRdv.dateFin
              }

            }
          }
        }
        return rdv
      }
    ))

    // Envoi de la réponse
    res.status(200).json({
      event: events,permission:partages ? partages.permission : "Owner"
    });

  } catch (error) {
    // Log de l'erreur pour monitoring
    console.error('Erreur lors de la récupération des événements:', error);

    next(error);
  }
};
apiRouter.get("/getDate",isAuthentified,getAgendaEvents)


module.exports = apiRouter;
