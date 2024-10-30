const User = require('../../database/models/user');
const { sendResetMail} = require('../../utils/mailer');
const { createVerificationToken } = require("../../utils/tokenGenerator");
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');

const forgottenPassword = async (req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/")
    }
    else{
        res.render("forgottenPasswordForm");

    }
}

const forgottenPasswordLinkMaker  = async(req,res)=>{
        if(req.isAuthenticated()){
            return;
        }
        const { email } = req.body;
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        if(!email){
            req.flash("error","Entrer votre adresse mail");
            return res.redirect("/forgotten-password");
        }else{

            if(!emailRegex.test(email)){
                req.flash("error","Veuillez entrer une adresse mail valide")
               return res.redirect("/forgotten-password");
            }
            const user = await User.findOne({email:email});
            if(!user){
                req.flash("error","adresse mail non trouvé");
               return res.redirect("/forgotten-password");
            }
            else{
                const token = createVerificationToken(user);
                user.resetPasswordToken = token;
                user.save();
                const sendingMail = await sendResetMail(user,token);
              return  res.render("resetPasswordLinkConfirmation");
            }
        }
}
const resetPassword = async(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect("/")
    }
    const {token} = req.query
    const currentTime = Math.floor(Date.now() / 1000);
    try{
        const verifyToken = jwt.verify(token,process.env.JWT_SECRET);
        
        const user = User.findById(verifyToken.id);
        if(!user){
            req.flash("error","utilisateur non trouvé");
            res.redirect(401,"/forgottenPassword");
        }else{
            res.render("passwordChange",{token:token});
        }
    }catch(error){
        req.flash("error","ce lien n'est pas valide ou expiré");
        res.redirect("/forgotten-Password");
    }
    }
const changePassword = async(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect("/");
    }
    const {token} = req.query;
    const {password,confirmPassword} = req.body
    
    try{
        const verifytoken = jwt.verify(token,process.env.JWT_SECRET); 
        if(password!==confirmPassword){
            req.flash("error","les mots de passe doivent correspondre");
            req.redirect(`/reset-password?token=${token}`);         
        }
        else{
            if(password.length<8){
                req.flash("error","le mot de passe doit faire plus de 8 caractères")
                req.redirect(`/reset-password?token=${token}`); 
            }
            const user = await User.findById(verifytoken.userId);
            if(!user){
                req.flash("error","Utilisateur non trouvé");
                res.redirect("/forgotten-password");
            }
            else{
                const hashedPassword = await argon2.hash(password);
                user.password = hashedPassword;
                user.save();
                res.redirect("/signin");
            }
        }
    }catch(error){
        console.log(error+"toto")
        req.flash("error","Token expiré ou non valide");
        res.redirect("/forgotten-password");
    }
}
module.exports = {
    forgottenPassword,
    forgottenPasswordLinkMaker,
    resetPassword,
    changePassword
}