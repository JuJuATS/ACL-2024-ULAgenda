const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    globalCategoryPersonalizations: [
        {
            categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
            personalizations: {
                color: String,
                priority: String,
                visibility: String,
                recurrence: String,
                defaultDuration: Number,
            },
        },
    ],
    personalCategories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Référence à la table 'Category'
        },
    ],
    isVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
