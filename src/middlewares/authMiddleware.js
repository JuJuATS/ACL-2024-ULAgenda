// MiddleWare qui permet de vérifier qu'un utilisateur est connecté.
const isAuthentified = (req, res, next) => {
    console.log("ça proc")
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/signin');
}

module.exports = isAuthentified;
