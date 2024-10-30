const signin = async(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect("/");
    }
    else{
        res.render("signin");
    }
}

module.exports = signin;
