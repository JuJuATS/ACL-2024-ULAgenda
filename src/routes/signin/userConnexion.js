const User = require('../../database/models/user');
const userConnexion = async (req,res)=>{
    const {email, password} = req.body;

    if(!email || !password){
        res.text("Email ou mot de passe manquant")
        res.redirect(400,"/login");
    }
    const existingUser = await User.findOne({ $and: [{ email:email }, { password: password }] });
    req.flash("nom d'utilisateur ou mot de passe incorrect","error");
    if(existingUser){
        req.session.isLoggedIn = true;
        req.session.email = pseudonyme; 
        res.redirect(302,"/")
    }
    else{
        req.flash("error","nom d'utilisateur ou mot de passe incorrect");
        res.redirect(400,"/login")
    }
}


module.exports = userConnexion;