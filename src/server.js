const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
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
app.use(session({
  secret: '8b6d27cea47cc8732f8e32b912c4e149a38f46ac68d95ac0886d84e9ae39400ec8c4745731c0e5fa100cd78be62050ae3ec258dc851a0e95d96b3a70e36c9c1c',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // false car on n'est pas en HTTPS
}));


// Configuration des messages flash
app
  .use(flash())
  .use((req, res, next) => {
    res.locals.messages = req.flash();  
    next();
});

// Route de base
app.get('/', (req, res) => {
  res.send('Welcome to ULAgenda!');
});

// Routes pour afficher le formulaire d'inscription
app
  .get('/signup', (req, res) => res.render('signup'))
  .post('/signup', routes.createAccount);


// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});