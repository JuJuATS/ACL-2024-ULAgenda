const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendVerificationEmail = (user, token) => {
    const verificationLink = `http://localhost:3000/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Vérification de votre adresse email',
        html: `<p>Bonjour ${user.firstname},</p>
               <p>Merci de vous être inscrit sur ULAgenda. Veuillez vérifier votre adresse email en cliquant sur le lien suivant :</p>
               <a href="${verificationLink}">Vérifier mon email</a>
               <p>Ce lien est valide pendant 1 heure.</p>`,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
