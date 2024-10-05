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
            return res.status(400).send('Utilisateur non trouvé');
        }

        // Vérifier si l'utilisateur est déjà vérifié
        if (user.isVerified) {
            return res.send('Email déjà vérifié.');
        }

        user.isVerified = true;
        await user.save();

        res.send('Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.');
    } catch (error) {
        return res.status(400).send('Token invalide ou expiré.');
    }
};

module.exports = verifyEmail;
