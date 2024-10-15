// MiddleWare qui permet de vérifier qu'un utilisateur est connecté.
isAuthentified = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Non authentifié' });
    }
    next();
}

module.exports = isAuthentified;