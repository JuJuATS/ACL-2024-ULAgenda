// MiddleWare qui permet de vérifier qu'un utilisateur est connecté.
const isAuthentified = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/signin');
}

module.exports = isAuthentified;
