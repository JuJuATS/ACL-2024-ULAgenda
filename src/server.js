/**
 * ==================================================
 *                IMPORTS + VARIABLES
 * ==================================================
 */

require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});



// -- IMPORT MODULES --

const express = require('express');
const session = require('express-session');
const MangoStore = require('connect-mongo');
const MemoryStore = require('memorystore')(session);
const flash = require('connect-flash')
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const methodOverride = require('method-override');

// -- IMPORT ROUTES --
const routes = require('./routes');
const agendaRoutes = require('./routes/agendas/agendas');
const rdvRoutes = require("./routes/agendas/rdvs")

// -- BBD --
const connectDB = require('./database/db');
const User = require('./database/models/user');
const { sign } = require('crypto');
const isAuthentified = require('./middlewares/authMiddleware');
const ObjectId = require('mongodb').ObjectId;

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
  .use(flash())
  // Middleware pour les requêtes PUT et DELETE depuis un formulaire
  .use(methodOverride('_method'));

// Configuration des sessions
let store;
if (process.env.NODE_ENV !== 'test') {
  store  = MangoStore.create({
    mongoUrl: process.env.DB_URI,
    ttl: 7 * 24 * 60 * 60, // Durée de validité de la session: 1 semaine
    collectionName: 'sessions',
    autoRemove: 'interval',
    autoRemoveInterval: 10,
  });
} else {
  store = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
}

app.use(session({
  secret: process.env.SECRET,
  resave: true,
  rolling: true,
  saveUninitialized: false,
  store,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // Durée de validité de la session: 1 semaine
    httpOnly: true,
    secure: false // false en HTTP, true en HTTPS
  },
}));


// Configuration des messages flash
app.use((req, res, next) => {
  res.locals.flash = req.flash();
  next();
});


// Route de base
app.get('/', async (req, res) => {
  let userInfo = null;
  if (req.session.userId) {
    const user = await User.findById(req.session.userId)
    userInfo = { firstname: user.firstname, lastname: user.lastname, pseudo: user.pseudo };
  }
  res.render('index', { user: userInfo} )
});

app.use('/agendas', agendaRoutes);
app.use('/rendezvous',rdvRoutes);
// Routes pour afficher le formulaire d'inscription
app
  .get('/signup', (req, res) => res.render('signup',{expressFlash:req.flash("error")}))
  .post('/signup', routes.signup.createAccount);

app.get('/successfull-signup', (req, res) => res.send('Inscription réussie, veuillez vérifier votre email.'));

// Route pour vérifier l'email
app.get('/verify-email', routes.signup.verifyEmail);

// Route de connection
app.get("/signin",routes.signin.signin).post("/signin",routes.signin.userConnexion);

// Route pour récuperer son mot de passe
app.get("/forgotten-password",routes.signin.forgottenPassword).post("/forgotten-password",routes.signin.forgottenPasswordLinkMaker);
app.get("/reset-password",routes.signin.resetPassword).post("/reset-password",routes.signin.changePassword);


// Routes en lien avec les presets
app
  .get('/presets', isAuthentified, routes.presets.getPresets)
  .get('/presets/new', isAuthentified, routes.presets.createPreset)
  .get('/presets/:id', isAuthentified, routes.presets.getPresetEditionPage)
  .delete('/presets/:id', isAuthentified, routes.presets.deletePreset)
  .put('/presets/:id', isAuthentified, routes.presets.updatePreset)
  .use('/presets/api/:id', isAuthentified, routes.presets.getPresetInfosById);

app.get("/logout",routes.signin.logout);

// Démarrage du serveur
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Serveur en écoute sur http://localhost:${port}`);
  });
}

module.exports = app
