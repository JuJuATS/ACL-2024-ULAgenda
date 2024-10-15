// MiddleWare qui permet de vérifier qu'un utilisateur est connecté.
const isAuthentified = (req, res, next) => {
    if (!req.session || !req.session.id) {
        return res.status(401).json({ message: 'Non authentifié' });
    }
    next();
}

module.exports = isAuthentified;
