const signin = require('./signin');
const logout = require('./logout')
const {forgottenPassword, forgottenPasswordLinkMaker,resetPassword,changePassword} = require("./forgottenPassword")
module.exports = {
    signin,
    forgottenPassword,
    forgottenPasswordLinkMaker,
    resetPassword,
    changePassword,
    logout
};
