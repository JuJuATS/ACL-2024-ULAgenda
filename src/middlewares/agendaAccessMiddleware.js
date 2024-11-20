const Agenda = require('../database/models/agenda');
const Share = require('../database/models/share');

const checkAgendaAccess = async (req, res, next) => {
    try {
        // Récupérer l'ID de l'agenda depuis les différentes sources possibles
        const agendaId = req.query.agendaId || req.params.id || req.params.agendaId || req.body.agendaId;
        const userId = req.user.id;

        if (!agendaId) {
            return res.status(400).json({ message: 'ID de l\'agenda manquant' });
        }

        // Récupérer l'agenda
        const agenda = await Agenda.findById(agendaId);
        
        if (!agenda) {
            return res.status(404).json({ message: 'Agenda non trouvé' });
        }

        // Vérifier si l'utilisateur est le propriétaire
        if (agenda.userId.equals(userId)) {
            req.accessLevel = 'owner';
            req.agenda = agenda;
            return next();
        }

        // Chercher un partage valide
        const share = await Share.findOne({
            agendaId: agendaId,
            sharedWith: userId,
            shareType: 'user'
        });

        // Vérifier si le partage existe et est valide
        if (!share || !share.isValid()) {
            return res.status(403).json({ 
                message: 'Vous n\'avez pas les droits nécessaires pour accéder à cet agenda'
            });
        }

        // Définir le niveau d'accès en fonction de la permission
        req.accessLevel = share.permission;
        req.agenda = agenda;
        req.share = share;
        next();

    } catch (error) {
        const message = error.message;
        console.error('Erreur lors de la vérification des droits d\'accès:', error);
        res.status(500).json({
            error : 'Erreur lors de la vérification des droits d\'accès', message
        });
    }
};

const checkModifyRights = (req, res, next) => {
    // Les propriétaires et les utilisateurs avec droits contribute/admin peuvent modifier
    if (req.accessLevel === 'owner' || req.accessLevel === 'contribute' || req.accessLevel === 'admin') {
        return next();
    }
    
    res.status(403).json({ 
        message: 'Vous n\'avez pas les droits nécessaires pour modifier cet agenda'
    });
};

const checkAdminRights = (req, res, next) => {
    if (req.accessLevel === 'owner' || req.accessLevel === 'admin') {
        return next();
    }
    
    res.status(403).json({ 
        message: 'Vous devez être administrateur pour effectuer cette action'
    });
};

module.exports = {
    checkAgendaAccess,
    checkModifyRights,
    checkAdminRights
};
