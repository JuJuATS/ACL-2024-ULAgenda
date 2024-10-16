const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    color: {
        type: String, // Couleur au format hexadécimal
        required: true,
    },
    isGlobal: {
        type: Boolean,
        default: false,
    },
    priority: {
        type: String,
        enum: ['Haute', 'Moyenne', 'Basse'],
        default: 'Moyenne',
    },
    visibility: {
        type: String,
        enum: ['Public', 'Privé'],
        default: 'Privé',  // Les rendez-vous sont privés par défaut
    },
    recurrence: {
        type: String,
        enum: ['Aucune', 'Quotidienne', 'Hebdomadaire', 'Mensuelle', 'Annuelle'],
        default: 'Aucune',  // Pas de récurrence par défaut
    },
    defaultDuration: {
        type: Number,
        default: 60,  // Durée par défaut de 60 minutes
    }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
