const User = require('../../database/models/user');
const argon2 = require('argon2');
const createVerificationToken = require('../../utils/createVerificationToken');
const { sendVerificationEmail } = require('../../utils/mailer');


const createAccount = async (req, res) => {
    const { nom, prenom, email, pseudo, password } = req.body;

    if (!nom || !prenom || !email || !pseudo || !password) {
        return res.status(400).send('Tous les champs sont obligatoires');
    }

    try {
        // Vérification si l'email ou le pseudo existent déjà
        const existingUser = await User.findOne({ $or: [{ email: email }, { pseudo: pseudo }] });
        if (existingUser) {
            const errors = {};
            if (existingUser.email === email) {
                errors.email = 'Un compte existe déjà avec cette adresse email';
            }
            if (existingUser.pseudo === pseudo) {
                errors.pseudo = 'Ce pseudo est déjà utilisé';
            }

            return res.status(400).render('signup', {
                error:errors,
                formData: req.body,
            });
        }

        const hashedPassword = await argon2.hash(password);

        const newUser = new User({
            firstname: prenom,
            lastname: nom,
            email: email,
            pseudo: pseudo,
            password: hashedPassword,
            isVerified: false,
        });

        // Génération du token de vérification
        const verificationToken = createVerificationToken(newUser);

        // Envoi de l'email de vérification
        await sendVerificationEmail(newUser, verificationToken);

        // Sauvegarde de l'utilisateur dans la base de données
        await newUser.save();
        console.log("je redirige")
        res.redirect('/');
    } catch (error) {
        console.error(error);
        const messagesFlash = [{ type: 'error', content: 'Erreur lors de la création du compte' }];
        res.render('signup', { messagesFlash, formData: req.body,expressFlash:req.flash() });
    }
};

module.exports = createAccount;
