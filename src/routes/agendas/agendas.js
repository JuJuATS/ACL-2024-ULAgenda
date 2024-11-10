const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../database/models/user.js');
const Agenda = require('../../database/models/agenda.js');
const Share = require('../../database/models/share.js');
const authMiddleware = require('../../middlewares/authMiddleware.js');
const { 
    checkAgendaAccess, 
    checkAdminRights 
} = require('../../middlewares/agendaAccessMiddleware.js');
const router = express.Router();

// Route pour afficher les agendas
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Rechercher les agendas dont l'utilisateur est propriétaire
        const ownedAgendas = await Agenda.find({ userId: req.user.id });

        // Rechercher les agendas partagés avec l'utilisateur
        const shares = await Share.find({
            sharedWith: req.user.id,
            shareType: 'user'
        }).populate('agendaId');

        const sharedAgendas = shares
            .filter(share => share.isValid())
            .map(share => ({
                ...share.agendaId.toObject(),
                accessLevel: share.permission
            }));

        const agendas = [
            ...ownedAgendas.map(agenda => ({
                ...agenda.toObject(),
                accessLevel: 'owner'
            })),
            ...sharedAgendas
        ];

        res.render('agendas', { agendas });
    } catch (error) {
        console.error('Erreur lors de la récupération des agendas:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour mettre à jour le titre d'un agenda
router.put('/updateAgendaTitle', authMiddleware, checkAgendaAccess, checkAdminRights, async (req, res) => {
    try {
        const { agendaId, newTitle } = req.body;

        if (!newTitle) {
            return res.status(400).json({ 
                success: false, 
                message: 'Le nouveau titre est requis' 
            });
        }

        const updatedAgenda = await Agenda.findByIdAndUpdate(
            agendaId,
            { name: newTitle },
            { new: true }
        );

        res.json({ success: true, updatedAgenda });
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'agenda:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la modification' 
        });
    }
});

// Route pour supprimer un agenda
router.delete('/:id', authMiddleware, checkAgendaAccess, checkAdminRights, async (req, res) => {
    try {
        const deletedAgenda = await Agenda.findByIdAndDelete(req.params.id);
        
        // Supprimer également tous les partages associés
        await Share.deleteMany({ agendaId: req.params.id });

        res.status(200).json({ message: "Agenda supprimé avec succès" });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'agenda:', error);
        res.status(500).json({ 
            message: "Erreur lors de la suppression de l'agenda", 
            error 
        });
    }
});

// Route pour créer un nouvel agenda
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ 
                message: 'Le nom de l\'agenda est requis' 
            });
        }

        const newAgenda = new Agenda({ name, userId: req.user.id });
        await newAgenda.save();

        res.status(201).json(newAgenda);
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de la création de l'agenda", 
            error 
        });
    }
});

// Route pour la page de partage d'agenda
router.get('/:id/share', authMiddleware, checkAgendaAccess, checkAdminRights, async (req, res) => {
    try {
        const shares = await Share.find({
            agendaId: req.agenda._id
        }).populate('sharedWith');

        res.render('share-agenda', {
            agenda: req.agenda,
            shares: shares,
            user: req.user,
            isOwner: req.accessLevel === 'owner'
        });
    } catch (error) {
        console.error('Erreur lors du chargement de la page de partage:', error);
        req.flash('error', 'Une erreur est survenue lors du chargement de la page de partage');
        res.redirect('/agendas');
    }
});

// Route pour créer un nouveau partage
router.post('/:id/share', authMiddleware, checkAgendaAccess, checkAdminRights, async (req, res) => {
    try {
        const { email, permission, validFrom, validUntil, shareType } = req.body;

        if (!permission || !shareType) {
            return res.status(400).json({
                error: 'Les permissions et le type de partage sont requis'
            });
        }

        // Initialisation des données de partage communes
        const shareData = {
            agendaId: req.agenda._id,
            ownerId: req.user.id,
            permission,
            shareType,
            settings: {
                validFrom: validFrom || null,
                validUntil: validUntil || null
            }
        };

        // Cas du partage par lien
        if (shareType === 'link') {
            const existingShare = await Share.findOne({
                agendaId: req.agenda._id,
                shareType: 'link',
                permission: permission,
                'settings.validUntil': validUntil || null
            });

            if (existingShare && existingShare.isValid()) {
                const shareUrl = `${process.env.BASE_URL}/agendas/share/${existingShare.shareToken}`;
                return res.json({
                    exists: true,
                    message: 'Un lien de partage avec ces paramètres existe déjà. Vous pouvez utiliser ou modifier ce lien existant.',
                    share: existingShare,
                    shareUrl
                });
            }

            // Création du partage par lien
            const share = new Share(shareData);
            share.generateShareLink();
            await share.save();
            const shareUrl = `${process.env.BASE_URL}/agendas/share/${share.shareToken}`;
            return res.status(201).json({ share, shareUrl });
        }

        // Cas du partage avec un utilisateur
        if (shareType === 'user') {
            if (!email) {
                return res.status(400).json({
                    error: 'Email requis pour le partage avec un utilisateur'
                });
            }

            const targetUser = await User.findOne({ email });
            if (!targetUser) {
                return res.status(404).json({
                    error: 'Utilisateur non trouvé'
                });
            }

            const existingShare = await Share.findOne({
                agendaId: req.agenda._id,
                sharedWith: targetUser._id,
                shareType: 'user'
            });

            if (existingShare) {
                return res.json({
                    exists: true,
                    message: 'Cet agenda est déjà partagé avec cet utilisateur. Vous pouvez modifier ses droits d\'accès si nécessaire.',
                    shareId: existingShare._id
                });
            }

            shareData.sharedWith = targetUser._id;
            
            // Création et sauvegarde du partage utilisateur
            const share = new Share(shareData);
            await share.save();

            // Récupération du partage avec les informations utilisateur peuplées
            const populatedShare = await Share.findById(share._id)
                .populate('sharedWith', 'email pseudo');

            return res.status(201).json(populatedShare);
        }

    } catch (error) {
        console.error('Erreur lors de la création du partage:', error);
        res.status(500).json({
            error: 'Erreur lors de la création du partage'
        });
    }
});

// Route pour supprimer un partage
router.delete('/:agendaId/share/:shareId', authMiddleware, checkAgendaAccess, checkAdminRights, async (req, res) => {
    try {
        await Share.findByIdAndDelete(req.params.shareId);
        res.status(200).json({
            message: 'Partage supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du partage:', error);
        res.status(500).json({
            error: 'Erreur lors de la suppression du partage'
        });
    }
});

router.delete('/:agendaId/share/delete-all/:shareType', authMiddleware, checkAgendaAccess, checkAdminRights, async (req, res) => {
    try {
        const { agendaId, shareType } = req.params;

        if (!['link', 'user'].includes(shareType)) {
            return res.status(400).json({
                error: 'Type de partage invalide'
            });
        }

        await Share.deleteMany({
            agendaId,
            shareType
        });

        res.sendStatus(204);  // Succès sans contenu

    } catch (error) {
        console.error('Erreur lors de la suppression des partages:', error);
        res.status(500).json({
            error: 'Erreur lors de la suppression des partages'
        });
    }
});

// Route pour modifier un partage
router.put('/:agendaId/share/:shareId', authMiddleware, checkAgendaAccess, checkAdminRights, async (req, res) => {
    try {
        const { permission, validFrom, validUntil } = req.body;

        const updatedShare = await Share.findByIdAndUpdate(
            req.params.shareId,
            {
                permission,
                settings: {
                    validFrom: validFrom || null,
                    validUntil: validUntil || null
                }
            },
            { new: true }
        );

        res.json(updatedShare);
    } catch (error) {
        console.error('Erreur lors de la modification du partage:', error);
        res.status(500).json({
            error: 'Erreur lors de la modification du partage'
        });
    }
});

// Route pour accéder à un agenda via un lien de partage
router.get('/share/:token', authMiddleware, async (req, res) => {
    try {
        const { token } = req.params;

        // Vérifier et décoder le token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            req.flash('error', 'Lien de partage invalide ou expiré');
            return res.redirect('/agendas');
        }

        const linkShare = await Share.findOne({
            _id: decoded.shareId,
            shareToken: token,
            shareType: 'link'
        });

        if (!linkShare || !linkShare.isValid()) {
            req.flash('error', 'Lien de partage invalide ou expiré');
            return res.redirect('/agendas');
        }

        // Vérifier le partage existant
        const existingShare = await Share.findOne({
            agendaId: linkShare.agendaId,
            sharedWith: req.user.id,
            shareType: 'user'
        });

        if (existingShare) {
            if (existingShare.permission !== linkShare.permission) {
                existingShare.permission = linkShare.permission;
                existingShare.settings = linkShare.settings;
                await existingShare.save();
                req.flash('success', 'Vos permissions d\'accès ont été mises à jour');
            } else {
                req.flash('info', 'Vous avez déjà accès à cet agenda');
            }
        } else {
            const newUserShare = new Share({
                agendaId: linkShare.agendaId,
                ownerId: linkShare.ownerId,
                sharedWith: req.user.id,
                shareType: 'user',
                permission: linkShare.permission,
                settings: linkShare.settings
            });
            await newUserShare.save();
            req.flash('success', 'Accès à l\'agenda accordé');
        }

        res.redirect(`/rendezvous?agendaId=${linkShare.agendaId}`);
    } catch (error) {
        console.error('Erreur lors de l\'accès via le lien de partage:', error);
        req.flash('error', 'Une erreur est survenue lors de l\'accès à l\'agenda');
        res.redirect('/agendas');
    }
});

module.exports = router;
