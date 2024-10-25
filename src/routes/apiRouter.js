const express = require('express');
const isAuthentified = require('../middlewares/authMiddleware');
const { getPresetInfosById } = require('../routes/presets');

const apiRouter = express.Router();

// Route pour récupérer les informations d'un preset à partir de son id
apiRouter.get('/presets/:id', isAuthentified, getPresetInfosById);

module.exports = apiRouter;
