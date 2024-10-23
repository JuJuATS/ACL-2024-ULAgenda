const mongoose = require('mongoose');

const rdvSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },
    agendaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agenda', required: true },
    recurrences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recurrence' }],
    description: { type: String }
    
});

const Rdv = mongoose.model('Rdv', rdvSchema);

module.exports = { rdvSchema: rdvSchema, Rdv: Rdv };
