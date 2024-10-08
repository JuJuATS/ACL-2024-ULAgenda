


const signin = async(req,res)=>{
    if(req.session.isLoggedIn){
        return res.redirect("/");
    }
    else{
        res.render("signin")
    }
}


module.exports = signin;
