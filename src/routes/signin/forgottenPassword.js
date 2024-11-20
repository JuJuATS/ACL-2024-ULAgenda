const User = require('../../database/models/user');
const { sendResetMail} = require('../../utils/mailer');
const { createVerificationToken } = require("../../utils/tokenGenerator");
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');

const forgottenPassword = async (req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/");
    }
    else{
        res.render("forgottenPasswordForm",{expressFlash:req.flash("error")});

    }
}

const forgottenPasswordLinkMaker  = async(req,res)=>{
        console.log("on m'interroge")
        if(req.isAuthenticated()){
            return;
        }
        console.log(req.body)

        const { email } = req.body;
        
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        if(!email){
           res.json({text:"l'Email est requis",success:false});
        }else{
            if(!emailRegex.test(email)){
                res.json({text:"Veuillez entrez un Email requis",success:false});
            }
            const user = await User.findOne({email:email});
            if(!user){
                res.json({text:"Utilisateur non trouvé",success:false});
            }
            else{
                const token = createVerificationToken(user);
                user.resetPasswordToken = token;
                user.save();
                const sendingMail = await sendResetMail(user,token);
                res.json({text:"un mail vous été envoyer",success:true})
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
            
            res.redirect("/forgottenPassword");
        }else{
            res.render("passwordChange",{token:token});
        }
    }catch(error){
        res.redirect("/forgotten-Password");
    }
    }
const changePassword = async(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect("/");
    }
    
    const {password,confirmPassword,token} = req.body
    
    
    try{
        const verifytoken = jwt.verify(token,process.env.JWT_SECRET); 
        if(password!==confirmPassword){
            return res.json({text:"les mot de passes doivent correspondre",success:false})       
        }
        else{
            if(password.length<8){
                return res.json({text:"le mot de passe doit faire plus de 8 caractères",success:false}) 
            }
            const user = await User.findById(verifytoken.userId);
            if(!user){
               return res.json({text:"Utilisateur non trouvé",success:false})
            }
            else{
                const hashedPassword = await argon2.hash(password);
                user.password = hashedPassword;
                user.save();
               return res.json({text:"success",success:true})
            }
        }
    }catch(error){
        res.json({text:"token invalide ou expiré",success:false})
    }
}
module.exports = {
    forgottenPassword,
    forgottenPasswordLinkMaker,
    resetPassword,
    changePassword
}