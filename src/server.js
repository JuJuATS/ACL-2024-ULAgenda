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
const MemoryStore = require('memorystore')(session);
const flash = require('connect-flash')
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const methodOverride = require('method-override');
const passport = require('./config/passport');
const crypto = require('crypto');
const argon2 = require('argon2');



// -- IMPORT ROUTES --
const routes = require('./routes');
const agendaRoutes = require('./routes/agendas/agendas');
const rdvRoutes = require("./routes/agendas/rdvs")
const apiRouter = require('./routes/apiRouter');

const planningRoute = require("./routes/planning/planning")

// -- BBD --
const connectDB = require('./database/db');
const isAuthentified = require('./middlewares/authMiddleware');
const User = require('./database/models/user');  // Assurez-vous que le chemin est correct

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
    checkPeriod: 86400000
  });
}

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  rolling: true,
  saveUninitialized: false,
  store,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // Durée de validité de la session: 1 semaine
    httpOnly: true,
    secure: false // false en HTTP, true en HTTPS
  },
}));

// Middlewares pour Passport.js
app.use(passport.initialize())
   .use(passport.session());

// Configuration des messages flash
app.use((req, res, next) => {

  // A DECOMMENTER SI PROBLEMES AVEC LES VARIABLES DE SESSIONS
  // req.session.isLoggedIn = req.isAuthenticated();
  // req.session.user = req.user;
  // req.session.userId = req.user ? req.user.id : null;

  res.locals.flash = req.flash();
  next();
});

// Montage du routeur API
app.use('/api', apiRouter);


// Montage du routeur pour la recherche de rendez-vous
app.use('/search', routes.searchRouter);


// Route de base
app.get('/', async (req, res) => {
  res.render('index', { user: req.user} );
});


app.get('/profil', async (req, res) => {
  res.render('profil', { user: req.user} );
});
app.use('/agendas', agendaRoutes);
app.use('/rendezvous', rdvRoutes);
// Routes pour afficher le formulaire d'inscription
app
  .get('/signup', (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect('/');
    }
    res.render('signup');
  })
  .post('/signup', routes.signup.createAccount);

app.get('/successfull-signup', (req, res) => res.send('Inscription réussie, veuillez vérifier votre email.'));

// Route pour vérifier l'email
app.get('/verify-email', routes.signup.verifyEmail);

// Route de connection
app
  .get("/signin",routes.signin.signin)
  .post('/signin', (req, res, next) => {
  passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect: '/signin',
    failureFlash: true,
    
  },(err, user, info)=> {
    if (err) {
      return next(err); // will generate a 500 error
    }
    // Generate a JSON response reflecting authentication status
    if (! user) {
      return res.json({ success : false, message : info.message });
    }
    req.login(user, function(err){
      if(err){
        return next(err);
      }
      return res.json({ success : true, message : 'authentication succeeded' });        
    });
  })(req, res, next);
});
// Route pour récuperer son mot de passe
app.get("/forgotten-password",routes.signin.forgottenPassword).post("/forgotten-password",routes.signin.forgottenPasswordLinkMaker);
app.get("/reset-password",routes.signin.resetPassword).post("/reset-password",routes.signin.changePassword);

app.use("/planning",routes.planning);
// Routes en lien avec les presets
app
  .get('/presets', isAuthentified, routes.presets.getPresets)
  .get('/presets/new', isAuthentified, routes.presets.createPreset)
  .get('/presets/:id', isAuthentified, routes.presets.getPresetEditionPage)
  .delete('/presets/:id', isAuthentified, routes.presets.deletePreset)
  .put('/presets/:id', isAuthentified, routes.presets.updatePreset);

app.get("/logout",routes.signin.logout);

// Démarrage du serveur
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Serveur en écoute sur http://localhost:${port}`);
  });
}

// Route pour la page du compte utilisateur
app.get('/account', isAuthentified, (req, res) => {
  
  res.render('account', { user: req.user });
});

app.post('/update-profile', isAuthentified, async (req, res) => {
  try {
      const userId = req.user.id; // Identifiant de l'utilisateur connecté
      const { nom, prenom, pseudo, password } = req.body;

      // Création d'un objet avec les champs à mettre à jour
      const updateFields = {
          lastname: nom,
          firstname: prenom,
           // Assurez-vous que l'email est en minuscule pour éviter les conflits
          pseudo: pseudo
      };

      // Si un mot de passe est fourni, on le hache et on l'ajoute aux données de mise à jour
      if (password) {
          const hashedPassword = await argon2.hash(password); // Hachage du nouveau mot de passe
          updateFields.password = hashedPassword; // Mise à jour du champ password avec le mot de passe haché
      }

      // Mise à jour des informations de l'utilisateur dans la base de données
      const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

      // Mettre à jour l'utilisateur dans la session
      req.user = updatedUser;

      // Réponse à l'utilisateur après la mise à jour
      res.status(200).json({
          message: 'Profil mis à jour avec succès',
          passwordUpdated: !!password // Indique si un mot de passe a été mis à jour
      });

  } catch (error) {
      console.error('Erreur lors de la mise à jour du profil :', error);
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du profil.' });
  }
});




app.get('/profil', isAuthentified, async (req, res) => {
  // Les données mises à jour sont maintenant dans req.user après l'update
  res.render('profil', { user: req.user });
});


function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex'); // Générer un sel aléatoire
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`); // Hacher le mot de passe avec PBKDF2
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const hashToVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
  return hash === hashToVerify;
}



module.exports = app
