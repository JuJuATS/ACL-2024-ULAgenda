const cron = require('node-cron');
const User = require('../database/models/user');

// Fonction pour supprimer les utilisateurs non vérifiés
const deleteUnverifiedUsers = async () => {
    const verificationTimeLimit = 60 * 60 * 1000; // 1 heure en millisecondes
    const now = new Date();

    try {
        // Trouver les utilisateurs non vérifiés dont la date de création est supérieure à 24h
        const usersToDelete = await User.find({
            isVerified: false,
            createdAt: { $lt: new Date(now - verificationTimeLimit) }, // Sélectionner les utilisateurs créés il y a plus d'une heure
        });

        if (usersToDelete.length > 0) {
            // Supprimer les utilisateurs non vérifiés
            await User.deleteMany({ _id: { $in: usersToDelete.map(user => user._id) } });
            console.log(`${usersToDelete.length} comptes non vérifiés ont été supprimés.`);
        }
    } catch (error) {
        console.error('Erreur lors de la suppression des utilisateurs non vérifiés:', error);
    }
};

// Planifier la tâche pour s'exécuter toutes les heures
cron.schedule('0 * * * *', () => {
    console.log('Exécution de la tâche de suppression des comptes non vérifiés');
    deleteUnverifiedUsers();
});
