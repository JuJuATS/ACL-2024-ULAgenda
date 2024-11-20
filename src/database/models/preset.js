const mongoose = require('mongoose');

// Expression régulière pour vérifier qu'une couleur est bien un code hexadécimal
const hexColorRegex = /^#([0-9A-Fa-f]{6})$/;

const presetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    eventName: {
        type: String,
        trim: true,
        default: null,
    },
    color: {
        type: String,
        validate: {
            validator: function(v) {
                return hexColorRegex.test(v);
            },
            message: props => `${props.value} n'est pas un code couleur hexadécimal valide.`
        },
        default: '#2196F3', // La couleur par défaut est bleue
    },
    priority: {
        type: String,
        enum: ['Haute', 'Moyenne', 'Basse'],
        default: 'Moyenne',
    },
    recurrence: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recurrence',
    },
    duration: {
        type: Number,
        required: true,
        min: [0, 'La durée doit être une valeur positive.'],
        max: [1440, 'La durée doit être inférieure ou égale à 1440 minutes (24 heures).'],
        default: 60, // Durée par défaut de 60 minutes
    },
    startHour: {
        type: String,
        validate: {
            validator: function(v) {
                // On vérifie que l'heure est bien au format HH:MM ou null
                return !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: props => `'${props.value}' n'est pas une heure valide (format attendu : HH:MM).`
        },
        default: null,
    },
    description: {
        type: String,
        trim: true,
    },
    reminder: {
        type: Number,
        enum: [5, 10, 30, 60, 1440],
        default: null, // Pas de rappel par défaut
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
});

const Preset = mongoose.model('Preset', presetSchema);

module.exports = Preset;
