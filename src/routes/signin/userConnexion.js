const User = require('../../database/models/user');
const userConnexion = async (req,res)=>{
    const {email, password} = req.body;
    console.log(email,password)
    if(email == undefined || password == undefined){
        //res.text("Email ou mot de passe manquant")
        return res.redirect(400,"/signin")
    }
    const existingUser = await User.findOne({ $and: [{ email:email }, { password: password }] });
    //req.flash("nom d'utilisateur ou mot de passe incorrect","error");
    if(existingUser){
        if(!existingUser.isVerified){
            req.flash("error","Cette utilisateur n'est pas vérifié veuillez consultez votre boite mail afin de validez votre compte");
            return res.redirect(400,"/signin")
        }
        req.session.isLoggedIn = true;
        req.session.email = pseudonyme; 
        return res.redirect(302,"/")
    }
    else{
        req.flash("error","nom d'utilisateur ou mot de passe incorrect");
        return res.redirect(400,"/signin")
    }
}


module.exports = userConnexion;