require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MangoStore = require('connect-mongo');
const path = require('path');

const routes = require('./routes');

const connectDB = require('./database/db');
const populateCategories = require('./database/populateCategories');

const app = express();
const port = process.env.PORT;

// Connection à la base de données
connectDB();
// Peuplement des catégories
populateCategories();

// Configuration EJS comme moteur de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pour servir les fichiers du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour analyser les données JSON
app.use(express.json());

// Middleware pour analyser les données du formulaire
app.use(express.urlencoded({ extended: true }));


// Configuration des sessions
let store;
if (process.env.NODE_ENV == 'test') {
  // Utilisation de MemoryStore pour les tests
  const MemoryStore = require('memorystore')(session);
  store = new MemoryStore({
    checkPeriod: 86400000
  });
} else {
  store  = MangoStore.create({
    mongoUrl: 'mongodb://localhost:27017/db_ulagenda',
    ttl: 2 * 60 * 60, // Durée de validité de la session: 2 heures
    collectionName: 'sessions',
    autoRemove: 'interval',
    autoRemoveInterval: 10,
  });
}

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


// Middleware pour vérifier si l'utilisateur est connecté
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/signin');
}


// Configuration des variables res.locals
app.use((req, res, next) => {
  res.locals.messagesFlash = [];
  if (req.session.messagesFlash) {
    res.locals.messagesFlash = req.session.messagesFlash;
    req.session.messagesFlash = []; // Réinitialisation des messages flash
  }
  next();
});


// Route de base
app.get('/', (req, res) => res.render('index', {user: req.session.user}));

// Routes pour afficher le formulaire d'inscription
app
  .get('/signup', (req, res) => res.render('signup'))
  .post('/signup', routes.signup.createAccount);

app.get('/successfull-signup', (req, res) => res.send('Inscription réussie, veuillez vérifier votre email.'));

// Route pour vérifier l'email
app.get('/verify-email', routes.signup.verifyEmail);


// Route pour la personnalisation des catégories
app
  .get('/manage-categories', isAuthenticated, routes.categories.getCategories)
  .get('/edit-category/:categoryId', isAuthenticated, routes.categories.editCategory)
  .put('/update-category/:categoryId', isAuthenticated, routes.categories.updateCategory)
  .delete('/reset-category/:categoryId', isAuthenticated, routes.categories.resetCategory);


// Démarrage du serveur
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Serveur en écoute sur http://localhost:${port}`);
  });
}

module.exports = app;
