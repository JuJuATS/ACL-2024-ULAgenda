const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const argon2 = require('argon2');
const User = require('../database/models/user');


passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email: email.toLowerCase() });
                if (!user) {
                    return done(null, false, { message: "Utilisateur non trouvé." });
                }
                if (!user.isVerified) {
                    return done(null, false, { message: 'Votre compte n\'a pas été vérifié. Veuillez regarder votre boîte mail.' });
                }
                const isPasswordValid = await argon2.verify(user.password, password);
                if (!isPasswordValid) {
                    return done(null, false, { message: 'Mot de passe incorrect.' });
                }
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const foundUser = await User.findById(id);
        if (!foundUser) {
            return done(null, false);
        }
        // Inclure firstname et lastname dans l'objet renvoyé
        done(null, {
            id: foundUser._id,
            email: foundUser.email,
            pseudo: foundUser.pseudo,
            firstname: foundUser.firstname,  
            lastname: foundUser.lastname,    
        });
    } catch (error) {
        done(error);
    }
});


module.exports = passport;
