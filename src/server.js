require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MangoStore = require('connect-mongo');
const path = require('path');

const routes = require('./routes');

const connectDB = require('./database/db');
const User = require('./database/models/user');

const app = express();
const port = process.env.PORT;

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
  mongoUrl: process.env.DB_URL,
  ttl: 2 * 60 * 60, // Durée de validité de la session: 2 heures
  collectionName: 'sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10,
});

app.use(session({
  secret: process.env.SECRET,
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
app.get('/', (req, res) => res.render('index', req.session.user));    //{user: {pseudo:"lol"}}

// Routes pour afficher le formulaire d'inscription
app
  .get('/signup', (req, res) => res.render('signup'))
  .post('/signup', routes.signup.createAccount);

app.get('/successfull-signup', (req, res) => res.send('Inscription réussie, veuillez vérifier votre email.'));

// Route pour vérifier l'email
app.get('/verify-email', routes.signup.verifyEmail);


// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});