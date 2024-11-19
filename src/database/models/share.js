const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const shareSchema = new mongoose.Schema({
    agendaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agenda',
        required: true
    },
    
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    sharedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    
    shareType: {
        type: String,
        enum: ['user', 'link'],
        required: true
    },
    
    shareToken: {
        type: String,
        unique: true,
        sparse: true
    },
    
    permission: {
        type: String,
        enum: ['read', 'contribute', 'admin'],
        default: 'read',
        required: true
    },
    
    settings: {
        validFrom: Date,
        validUntil: {
            type: Date,
            required: function() {
                return this.shareType === 'link';
            },
            validate: {
                validator: function(value) {
                    if (this.shareType === 'link') {
                        // Vérifier que la date est dans le futur
                        return value > new Date();
                    }
                    return true;
                },
                message: 'La date de fin de validité doit être dans le futur pour les liens de partage'
            }
        }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Validation au niveau du schéma
shareSchema.pre('validate', function(next) {
    if (this.shareType === 'link') {
        // Vérifier que validUntil existe et n'est pas plus de 90 jours dans le futur
        if (!this.settings?.validUntil) {
            next(new Error('Une date de fin de validité est requise pour les liens de partage'));
        }
        
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 90);
        
        if (this.settings.validUntil > maxDate) {
            next(new Error('La date de fin de validité ne peut pas dépasser 90 jours'));
        }
    }
    next();
});

// Index existant
shareSchema.index(
    { agendaId: 1, sharedWith: 1 }, 
    { 
        unique: true,
        partialFilterExpression: { shareType: 'user' }
    }
);

// Méthode pour générer un lien de partage
shareSchema.methods.generateShareLink = function() {
    if (!this.settings?.validUntil) {
        throw new Error('Une date de fin de validité est requise pour générer un lien de partage');
    }

    const token = jwt.sign({
        shareId: this._id,
        agendaId: this.agendaId,
        permission: this.permission,
        validFrom: this.settings?.validFrom,
        validUntil: this.settings.validUntil
    }, process.env.JWT_SECRET, {
        expiresIn: Math.floor((new Date(this.settings.validUntil) - new Date()) / 1000)
    });
    
    this.shareToken = token;
    return token;
};

// Méthode existante isValid
shareSchema.methods.isValid = function() {
    const now = new Date();
    if (this.settings?.validUntil && now > this.settings.validUntil) {
        return false;
    }
    if (this.settings?.validFrom && now < this.settings.validFrom) {
        return false;
    }
    return true;
};

const Share = mongoose.model('Share', shareSchema);

module.exports = Share;