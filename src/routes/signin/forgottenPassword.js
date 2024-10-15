const User = require('../../database/models/user');
const { sendResetMail} = require('../../utils/mailer');
const { createVerificationToken } = require("../../utils/tokenGenerator");
const jwt = require('jsonwebtoken');


const forgottenPassword = async (req,res)=>{
    if(req.session.isLoggedIn){
        res.redirect(302,"/")
    }
    else{
        res.render("forgottenPasswordForm",{expressFlash:req.flash("error")});

    }
}

const forgottenPasswordLinkMaker  = async(req,res)=>{
        if(req.session.isLoggedIn){
            return;
        }
        const { email } = req.body;
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        if(!email){
            req.flash("errors","Entrer votre adresse mail");
            res.redirect(302,"/forgotten-password");
        }
        if(!emailRegex.test(email)){
            req.flash("errors","Veuillez entrer une adresse mail valide")
            res.redirect(302,"/forgotten-password");
        }
        const user = await User.findOneBy({email:email});
        if(!user){
            req.flash("errors","adresse mail non trouvé");
            res.redirect(302,"/forgotten-password");
        }
        else{
            const token = createVerificationToken(user);
            user.resetPasswordToken = token;
            user.save();
            const sendingMail = await sendResetMail(user,token);
            res.render("resetPasswordLinkConfirmation");
        }
}
const resetPassword = async(req,res)=>{
    if(req.session.isLoggedIn){
        return res.redirect("/")
    }
    const {token} = req.body
    const currentTime = Math.floor(Date.now() / 1000);
    try{
        const verifyToken = jwt.verify(token,process.env.JWT_SECRET);
    }catch(error){
        req.flash("errors","ce lien n'est pas valide ou expiré");
        res.redirect(403,"/forgottenPassword");
    }
  
    const user = User.findById(verifyToken.id);
    if(!user){
        req.flash("errors","utilisateur non trouvé");
        res.redirect(401,"/forgottenPassword");
    }else{
        res.render("passwordChange");
    }
}
const changePassword = async(req,res)=>{
    if(req.session.isLoggedIn){
        return res.redirect("/");
    }
    const {token,password,confirmPassword} = req.body
    try{
        const token = jwt.verify(token); 
        if(password!==confirmPassword){
            req.flash("errors","les mots de passe doivent correspondre");
            req.redirect(`/reset-password?token=${token}`);         
        }
        else{
            const user = await User.findById(token.id);
            if(!user){
                req.flash("Utilisateur non trouvé");
                res.redirect("/forgottenPassword");
            }
            else{
                user.password = password;
                user.save();
                res.redirect("/signin");
            }
        }
    }catch(error){
        req.flash("errors","Token expiré ou non valide");
        res.redirect(403,"/forgottenPassword");
    }
}
module.exports = {
    forgottenPassword,
    forgottenPasswordLinkMaker,
    resetPassword,
    changePassword
}