const User = require('../../database/models/user');
const argon2 = require('argon2');

const userConnexion = async (req,res)=>{
    const {email, password} = req.body;
    if(email == undefined || password == undefined){
        //res.text("Email ou mot de passe manquant")
        return res.redirect("/signin")
    }
    
    const existingUser = await User.findOne({ email: email });
    if(existingUser){
        const isPasswordValid = await argon2.verify(existingUser.password, password);
        if (!isPasswordValid) {
            req.flash("error", "nom d'utilisateur ou mot de passe incorrect");
            return res.redirect(400,",/signin");
        }
        if(!existingUser.isVerified){
            req.flash("error","Cette utilisateur n'est pas vérifié veuillez consultez votre boite mail afin de validez votre compte");
            return res.redirect(400,"/signin");
        }
        
        req.session.isLoggedIn = true;
        req.session.id = existingUser._id; 

        return res.redirect("/")
    } else {
        req.flash("error","nom d'utilisateur ou mot de passe incorrect");
        return res.redirect(400,"/signin");
    }
}

const logout = async (req,res)=>{
    req.session.destroy();
    res.redirect("/");
}

module.exports = {
    userConnexion,
    logout
};