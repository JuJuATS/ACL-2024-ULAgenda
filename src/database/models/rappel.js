const mongoose = require('mongoose');

const rappelSchema = new mongoose.Schema({
    //type: { type: String, enum: ["byYear","byMonth","byWeek"], required: true }, //
    duree:{type:Number},
    envoye:{type:Boolean}
});
const Rappel = mongoose.model('Rappel', rappelSchema);

module.exports = Rappel