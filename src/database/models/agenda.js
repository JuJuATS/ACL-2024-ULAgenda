const mongoose = require('mongoose');
const rdvSchema = require('./rdv');

const agendaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    rdvs: [rdvSchema]
}, { collection: 'agendas' });

const Agenda = mongoose.model('Agenda', agendaSchema);

module.exports = Agenda;