/**
 * ==================================================
 *                IMPORTS + VARIABLES
 * ==================================================
 */

require('dotenv').config();

// -- IMPORT MODULES --

const express = require('express');
const session = require('express-session');
const MangoStore = require('connect-mongo');
const flash = require('express-flash')
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('./config/passport');

// -- IMPORT ROUTES --
const routes = require('./routes');
const agendaRoutes = require('./routes/agendas/agendas');
const rdvRoutes = require("./routes/agendas/rdvs")

// -- BBD --
const connectDB = require('./database/db');

// -- EXPRESS --
const app = express();
const port = process.env.PORT || 3000;

/**
 * ==================================================
 *                  CONFIGURATION
 * ==================================================
 */

// Connection à la base de données
connectDB();

// Configuration EJS comme moteur de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// -- [MIDDLEWARES] --

// Middleware pour servir les fichiers du dossier public
app.use(express.static(path.join(__dirname, 'public')))
  // Middleware pour analyser les données du formulaire
  .use(express.urlencoded({ extended: true }))
  // Middleware pour analyser les données Json.
  .use(express.json())
  // Middleware pour cors.
  .use(cors())
  .use(morgan())
  .use(flash());


// Configuration des sessions
const store  = MangoStore.create({
  mongoUrl: process.env.DB_URI,
  ttl: 2 * 60 * 60, // Durée de validité de la session: 2 heures
  collectionName: 'sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10,
});

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  rolling: true,
  saveUninitialized: false,
  store,
  cookie: {
    maxAge: 2 * 60 * 60 * 1000, // Durée de validité du cookie: 2 heures
    httpOnly: true,
    secure: false // false en HTTP, true en HTTPS
  },
}));

// Middlewares pour Passport.js
app.use(passport.initialize())
   .use(passport.session());



// Configuration des variables res.locals
app.use((req, res, next) => {

  // A DECOMMENTER SI PROBLEMES AVEC LES VARIABLES DE SESSIONS
  // req.session.isLoggedIn = req.isAuthenticated();
  // req.session.user = req.user;
  // req.session.userId = req.user ? req.user.id : null;

  res.locals.expressFlash = req.flash("error");
  next();
});

// Route de base
app.get('/', async (req, res) => {
  res.render('index', { user: req.user} );
});

app.use('/agendas', agendaRoutes);
app.use('/rendezvous',rdvRoutes);
// Routes pour afficher le formulaire d'inscription
app
  .get('/signup', (req, res) => res.render('signup'))
  .post('/signup', routes.signup.createAccount);

app.get('/successfull-signup', (req, res) => res.send('Inscription réussie, veuillez vérifier votre email.'));

// Route pour vérifier l'email
app.get('/verify-email', routes.signup.verifyEmail);

// Route de connection
app
  .get("/signin",routes.signin.signin)
  .post("/signin", passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/signin',
    failureFlash: true
  }));

// Route pour récuperer son mot de passe
app.get("/forgotten-password",routes.signin.forgottenPassword).post("/forgotten-password",routes.signin.forgottenPasswordLinkMaker);
app.get("/reset-password",routes.signin.resetPassword).post("/reset-password",routes.signin.changePassword);
app.get("/logout",routes.signin.logout)

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});

module.exports = app
