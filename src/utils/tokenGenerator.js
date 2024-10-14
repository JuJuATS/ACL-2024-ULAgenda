// Crée un token de vérification JWT
const createVerificationToken = (user) => {
    const payload = { userId: user._id, email: user.email };
    const secret = process.env.JWT_SECRET;
    const options = { expiresIn: '1h' }; // Le token expire après 1 heure

    const token = jwt.sign(payload, secret, options);
    return token;
};
module.exports = {
    createVerificationToken
}