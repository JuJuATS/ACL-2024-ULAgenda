const mongoose = require('mongoose');

const recurrenceSchema = new mongoose.Schema({
    //type: { type: String, enum: ["byYear","byMonth","byWeek"], required: true }, //
    yearDay: { type: [String] },
    monthDay: { type: [Number] },
    weekDay: { type: [Number] },

    dateDebut: { type: Date, required: true },
    dateFin: { type: Date},// required: true },

});

// Ajout du champ virtuel pour le résumé
recurrenceSchema.virtual('summary').get(function() {
    const summary = [];

    if (this.weekDay && this.weekDay.length) {
        summary.push(`${this.weekDay.length} jour${this.weekDay.length > 1 ? 's' : ''}/semaine`);
    }

    if (this.monthDay && this.monthDay.length) {
        summary.push(`${this.monthDay.length} jour${this.monthDay.length > 1 ? 's' : ''}/mois`);
    }

    if (this.yearDay && this.yearDay.length) {
        summary.push(`${this.yearDay.length} date${this.yearDay.length > 1 ? 's' : ''}/an`);
    }

    return summary.length ? summary.join(', ') : 'Aucune récurrence';
});

const Recurrence = mongoose.model('Recurrence', recurrenceSchema);

module.exports = Recurrence;
