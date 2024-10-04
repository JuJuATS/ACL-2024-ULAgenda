const express = require('express');
const connectDB = require('./database/db');

const app = express();
const port = 3000;

// Connection à la base de données
connectDB();

// Route de base
app.get('/', (req, res) => {
  res.send('Welcome to ULAgenda!');
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});