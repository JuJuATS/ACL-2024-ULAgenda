const mongoose = require('mongoose');

const recurrenceSchema = new mongoose.Schema({
    type: { type: String, enum: ["byYear","byMonth","byWeek","byDay"], required: true }, //
    yearDay: { type: [Number] },
    monthDay: { type: [Number] },
    weekDay: { type: [Number] },

    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },

});

const Recurrence = mongoose.model('Recurrence', recurrenceSchema);

module.exports = Recurrence;
