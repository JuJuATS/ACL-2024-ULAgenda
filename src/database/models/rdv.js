const mongoose = require('mongoose');

const rdvSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    agendaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agenda', required: true },
    description: { type: String }
});

const Rdv = mongoose.model('Rdv', rdvSchema);

module.exports = rdvSchema;