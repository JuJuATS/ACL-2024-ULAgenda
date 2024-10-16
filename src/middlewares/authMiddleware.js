// MiddleWare qui permet de vérifier qu'un utilisateur est connecté.
const isAuthentified = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect("signin");
    }
    next();
}

module.exports = isAuthentified;
