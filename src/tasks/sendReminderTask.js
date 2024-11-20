const cron = require('node-cron');
const Rdv = require('../database/models/rdv');
const Rappel = require('../database/models/rappel');
const nodemailer = require('nodemailer');
const Agenda = require('../database/models/agenda');
const User = require('../database/models/user');

const sendMail = async ()=>{
    const rdvs  = Rdv.find({dateDebut:{$gt:new Date()}}).populate("agendaId")
    await Promise.all(rdvs.forEach( async (rdv)=>{
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
                    html: `Ceci est un rappel nommé ${rdv.name} qui se déroulera le ${rdv.dateDebut.toLocaleDateString("fr")}`
                };
            
                await transporter.sendMail(mailOptions);
                rappel.envoye = true
               await rappel.save();
           }
        }
    }))
}
// Planifier la tâche pour s'exécuter toutes les heures
if (process.env.NODE_ENV !== 'test') {
    cron.schedule('*/5 * * * *', () => {
        console.log('Envoie des mails de rappel');
        sendMail()
    });
}
