const mongoose = require('mongoose');

const rdvSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },
    priority: { type: String, enum: ['Basse', 'Moyenne', 'Haute'], default: 'Moyenne' },
    agendaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agenda', required: true },
    recurrences: { type: mongoose.Schema.Types.ObjectId, ref: 'Recurrence' },
    tags: { type: [String], default: [] },
    description: { type: String },
    rappel: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rappel' }]
});

// Ajout d'un champ virtuel pour la durée (en minutes)
rdvSchema.virtual('duration').get(function() {
    return Math.round((this.dateFin - this.dateDebut) / (1000 * 60));
});

// Permet d'incorporer les champs virtuels dans les objets JSON
rdvSchema.set('toJSON', { virtuals: true });
rdvSchema.set('toObject', { virtuals: true });

const Rdv = mongoose.model('Rdv', rdvSchema);

module.exports = Rdv;
