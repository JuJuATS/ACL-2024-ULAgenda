const User = require('../database/models/user');
const argon2 = require('argon2');

const createAccount = async (req, res) => {
    const { nom, prenom, email, pseudo, password } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email: email }, { pseudo: pseudo }] });
        if (existingUser) {
            req.flash('error', 'Un compte avec cet email ou pseudo existe déjà');
            req.flash('formData', req.body);
            return res.redirect('/signup');
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

        console.log(`Utilisateur créé: ${prenom} ${nom}, Email: ${email}, Pseudo: ${pseudo}`);
        req.flash('success', 'Compte créé avec succès !');
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de la création du compte:', error);
        req.flash('error', 'Erreur lors de la création du compte');
        // Stockage des données du formulaire dans la session en cas d'erreur
        req.flash('formData', req.body);
        res.redirect('/signup');
    }
};

module.exports = createAccount;
