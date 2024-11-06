const mongoose = require('mongoose');

const agendaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rdvs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rdv' }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { collection: 'agendas' });

const Agenda = mongoose.model('Agenda', agendaSchema);

module.exports = Agenda;
