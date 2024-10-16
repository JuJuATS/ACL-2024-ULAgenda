const signin = async(req,res)=>{
    if(req.session.isLoggedIn){
        return res.redirect("/");
    }
    else{
        //req.flash("error","welcome")
        const error = req.flash("error");
        res.render("signin",{expressFlash:error})
    }
}

module.exports = signin;
