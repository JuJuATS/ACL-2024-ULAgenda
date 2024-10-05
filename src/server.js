const express = require('express');
const session = require('express-session');
const MangoStore = require('connect-mongo');
const path = require('path');

const routes = require('./routes');

const connectDB = require('./database/db');
const User = require('./database/models/user');

const app = express();
const port = 3000;

// Connection à la base de données
connectDB();

// Configuration EJS comme moteur de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pour servir les fichiers du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour analyser les données du formulaire
app.use(express.urlencoded({ extended: true }));


// Configuration des sessions
const store  = MangoStore.create({
  mongoUrl: 'mongodb://localhost:27017/db_ulagenda',
  ttl: 2 * 60 * 60, // Durée de validité de la session: 2 heures
  collectionName: 'sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10,
});

app.use(session({
  secret: '8b6d27cea47cc8732f8e32b912c4e149a38f46ac68d95ac0886d84e9ae39400ec8c4745731c0e5fa100cd78be62050ae3ec258dc851a0e95d96b3a70e36c9c1c',
  resave: true,
  rolling: true,
  saveUninitialized: false,
  store,
  cookie: {
    maxAge: 2 * 60 * 60 * 1000, // Durée de validité du cookie: 2 heures
    httpOnly: true,
    secure: false // false en HTTP, true en HTTPS
  },
}));

// Configuration des variables res.locals
app.use((req, res, next) => {
  res.locals.messagesFlash = [];
  if (req.session.messagesFlash) {
    res.locals.messagesFlash = req.session.messagesFlash;
    req.session.messagesFlash = []; // Réinitialisation des messages flash
  }
  res.locals.user = req.session.user || null; 
  next();
});


// Route de base
app.get('/', (req, res) => res.render('index'));

// Routes pour afficher le formulaire d'inscription
app
  .get('/signup', (req, res) => res.render('signup'))
  .post('/signup', routes.createAccount);


// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});