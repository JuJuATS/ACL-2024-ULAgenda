const User = require('../database/models/user');
const argon2 = require('argon2');

const createAccount = async (req, res) => {
    const { nom, prenom, email, pseudo, password } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email: email }, { pseudo: pseudo }] });
        if (existingUser) {
            const errors = {};
            if (existingUser.email === email) {
                errors.email = 'Un compte existe déjà avec cette adresse email';
            }
            if (existingUser.pseudo === pseudo) {
                errors.pseudo = 'Ce pseudo est déjà utilisé';
            }

            return res.render('signup', {
                errors,
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
        });

        await newUser.save();

        // Enregistrement de l'utilisateur en session
        req.session.user = newUser;

        console.log(`Utilisateur créé: ${prenom} ${nom}, Email: ${email}, Pseudo: ${pseudo}`);
        req.session.messagesFlash = [{ type: 'success', content: 'Votre compte a bien été créé' }];
        res.redirect('/');
    } catch (error) {
        const messagesFlash = [{ type: 'error', content: 'Erreur lors de la création du compte' }];
        res.render('signup', { messagesFlash, formData: req.body });
    }
};

module.exports = createAccount;
