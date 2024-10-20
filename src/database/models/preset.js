const mongoose = require('mongoose');

const presetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    color: {
        type: String, // Couleur au format hexadécimal
        default: '#0000cd',  // Couleur bleue par défaut
    },
    priority: {
        type: String,
        enum: ['Haute', 'Moyenne', 'Basse'],
        default: 'Moyenne',
    },
    recurrence: {
        type: String,
        enum: ['Aucune', 'Quotidienne', 'Hebdomadaire', 'Mensuelle', 'Annuelle'],
        default: 'Aucune',  // Pas de récurrence par défaut
    },
    duration: {
        type: Number,
        default: 60,  // Durée par défaut de 60 minutes
        min: [0, 'La durée doit être supérieure ou égale à 0 minutes.'],
        max: [1440, 'La durée doit être inférieure ou égale à 1440 minutes (24 heures).'],
    },
    description: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
});

const Preset = mongoose.model('Preset', presetSchema);

module.exports = Preset;
