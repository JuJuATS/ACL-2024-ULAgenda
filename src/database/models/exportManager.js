const { createEvents } = require('ics');
const Agenda = require('./agenda.js');
const Recurrence = require("./recurrence");
const Rdv = require("./rdv");
const Share = require("./share");
class FileManager {
    constructor() {
    }

    /*async exportJSON(agendaIds) {
        try {
            const exportData = {}
            for (let id of agendaIds) {
                const populatedAgenda = await Agenda.findById(id).populate({
                    path: 'rdvs',
                    populate: { path: 'recurrences' }
                });
                exportData[`${id.slice(6)}${Date.now().toString(16)}`] = {
                    name: populatedAgenda.name,
                    rdvs: populatedAgenda.rdvs.map(rdv => {
                        const { agendaId, rappel, id, _id, __v, recurrences: rec, ...sanitizedRdv } = rdv.toObject();
                        const { id:id1, _id:id2, __v:v1, ...recurrences } = rec
                        return {...sanitizedRdv, recurrences};
                    })
                }
            }
            return exportData;
        } catch (error) {
            throw new Error(`Erreur lors de l'export du JSON: ${error.message}`);
        }
    }*/

    async exportJSON(agendaIds, userId) {
        try {
            const exportData = {}

            for (let id of agendaIds) {
                const agenda = await Agenda.findById(id)
                    .populate('userId')
                    .populate({
                        path: 'rdvs',
                        populate: { path: 'recurrences' }
                    });
                let ownedAgenda = null;
                if (agenda) {
                    if (agenda.userId.equals(userId)) ownedAgenda = id;
                    else {
                        const agenda_shares = await Share.find({agendaId: id})
                        for (let share of agenda_shares) {
                            if (share.sharedWith && userId.equals(share.sharedWith) && share.permission === 'admin') {
                                ownedAgenda = id
                            }
                        }
                    }
                }
                if (ownedAgenda) {
                    exportData[`${id.slice(6)}${Date.now().toString(16)}`] = {
                        name: agenda.name,
                        rdvs: agenda.rdvs.map(rdv => {
                            const { agendaId, rappel, id, _id, __v, recurrences: rec, ...sanitizedRdv } = rdv.toObject();
                            const { id:id1, _id:id2, __v:v1, ...recurrences } = rec
                            return {...sanitizedRdv, recurrences};
                        })
                    }
                }
            }

            return exportData;
        } catch (error) {
            throw new Error(`Erreur lors de l'export du JSON: ${error.message}`);
        }
    }

    async exportICS(agenda) {
        try {
            const populatedAgenda = await agenda.populate('rdvs');

            const events = populatedAgenda.rdvs.map(rdv => {
                const startDate = new Date(rdv.dateDebut);
                const endDate = new Date(rdv.dateFin);

                return {
                    title: rdv.name,
                    description: rdv.description || '',
                    start: [
                        startDate.getFullYear(),
                        startDate.getMonth() + 1,
                        startDate.getDate(),
                        startDate.getHours(),
                        startDate.getMinutes()
                    ],
                    end: [
                        endDate.getFullYear(),
                        endDate.getMonth() + 1,
                        endDate.getDate(),
                        endDate.getHours(),
                        endDate.getMinutes()
                    ],
                    categories: rdv.tags,
                    priority: rdv.priority === 'Haute' ? 1 : (rdv.priority === 'Moyenne' ? 2 : 3)
                };
            });

            return new Promise((resolve, reject) => {
                createEvents(events, (error, value) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(value);
                });
            });
        } catch (error) {
            throw new Error(`Error exporting ICS: ${error.message}`);
        }
    }

    async importJSON(jsonData, userId) {
        try {
            for (let agenda of Object.values(jsonData)) {
                const agendaObject = new Agenda({
                    name: agenda.name,
                    userId: userId,
                    rdvs: []
                });

                const rdvPromises = agenda.rdvs.map(async rdvData => {
                    let recurrenceId = null;
                    if (rdvData.recurrences) {
                        const recurrence = new Recurrence(rdvData.recurrences);
                        const savedRecurrence = await recurrence.save();
                        recurrenceId = savedRecurrence._id;
                    }

                    const rdv = new Rdv({
                        ...rdvData,
                        rappel: null,
                        agendaId: agendaObject._id,
                        recurrences: recurrenceId
                    });

                    const savedRdv = await rdv.save();
                    return savedRdv._id;
                });

                agendaObject.rdvs = await Promise.all(rdvPromises);

                await agendaObject.save();
            }
            return {success:true}
        } catch (error) {
            throw new Error(`Erreur lors de l'import du JSON: ${error.message}`);
        }
    }

    importICS() {
    }
}

const fileManager = new FileManager();

module.exports= { fileManager };
