const express = require('express');
const app = express();
const path = require('path');

// Utiliser EJS comme moteur de rendu
app.set('view engine', 'ejs');

// Route principale pour afficher la page
app.get('/', (req, res) => {
    res.render('index');
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
