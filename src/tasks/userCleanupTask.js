const cron = require('node-cron');
const User = require('../database/models/user');
const Rdv = require('../database/models/rdv');
const Rappel = require('../database/models/rappel');
const nodemailer = require('nodemailer');
const Agenda = require('../database/models/agenda');
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
if (process.env.NODE_ENV !== 'test') {
    cron.schedule('0 * * * *', () => {
        console.log('Exécution de la tâche de suppression des comptes non vérifiés');
        deleteUnverifiedUsers();
    });
}




const sendMail = async ()=>{
    const rdvs  = await Rdv.find({dateDebut:{$gt:new Date()}}).populate("agendaId")
   
    rdvs.forEach( async (rdv)=>{
        const rappel = await Rappel.findById(rdv.rappel);
        if(rappel && !rappel.envoye){
            const dateDebut = rdv.dateDebut;
            const now = new Date(Date.now());
           const timeBetween = (dateDebut.getTime() - now.getTime()) / 60000;
           if(timeBetween<= rappel.duree){
                const user = await User.findById(rdv.agendaId.userId)
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.EMAIL_PASSWORD,
                    },
                });
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: user.email,
                    subject: `rappel du rendezVous ${rdv.name}`,
                    html: `Ceci est un rappel nommé ${rdv.name} qui se déroulera le ${rdv.dateDebut.toLocaleDateString("fr")} à ${rdv.dateDebut.toLocaleTimeString(navigator.language, {
                        hour: '2-digit',
                        minute:'2-digit'
                      })}`
                };
            
                await transporter.sendMail(mailOptions);
                rappel.envoye = true
               await rappel.save();
           }
        }
    })
}
// Planifier la tâche pour s'exécuter toutes les heures
if (process.env.NODE_ENV !== 'test') {
    cron.schedule('*/5 * * * *', () => {
        console.log('Envoie des mails de rappel'); 
        sendMail()
    });
}
