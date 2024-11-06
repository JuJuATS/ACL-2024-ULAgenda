const jwt = require('jsonwebtoken');
const User = require('../../database/models/user');

// Vérifie le token de vérification et met à jour le statut de vérification de l'utilisateur
const verifyEmail = async (req, res) => {
    const token = req.query.token;
    const secret = process.env.JWT_SECRET;

    try {
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, secret);

        // Trouver l'utilisateur correspondant dans la base de données
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.render('email-verif', {message: 'Utilisateur non trouvé.'});
        }

        // Vérifier si l'utilisateur est déjà vérifié
        if (user.isVerified) {
            return res.render('email-verif', {message: 'Email déjà vérifié.'});
        }

        user.isVerified = true;
        await user.save();
        return res.render('email-verif', {message: 'Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.'});
    } catch (error) {
        return res.render('email-verif', {message: 'Erreur lors de la vérification du mail, message potentiellement expiré'});
    }
};

module.exports = verifyEmail;
