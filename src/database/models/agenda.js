const mongoose = require('mongoose');
const { rdvSchema } = require('./rdv');

const agendaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rdvs: [rdvSchema],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { collection: 'agendas' });

const Agenda = mongoose.model('Agenda', agendaSchema);

module.exports = Agenda;
