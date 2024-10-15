const signin = require('./signin');
const { userConnexion,logout } = require('./userConnexion')
const {forgottenPassword, forgottenPasswordLinkMaker,resetPassword,changePassword} = require("./forgottenPassword")
module.exports = {
    signin,
    userConnexion,
    forgottenPassword,
    forgottenPasswordLinkMaker,
    resetPassword,
    changePassword,
    logout
};
