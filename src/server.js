const express = require('express');

const app = express();
const port = 3000;

// Route de base
app.get('/', (req, res) => {
  res.send('Welcome to ULAgenda!');
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});