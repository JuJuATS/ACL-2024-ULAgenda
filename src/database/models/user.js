const mangoose = require('mongoose');

const userSchema = new mangoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    pseudo: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    personalCategories: {
        type: [String],
        default: [],
    },
    agendas: [{ type: mangoose.Schema.Types.ObjectId, ref: 'Agenda' }],
    isVerified: {
        type: Boolean,
        default: false,
    },
}, {timestamps: true});

const User = mangoose.model('User', userSchema);

module.exports = User;