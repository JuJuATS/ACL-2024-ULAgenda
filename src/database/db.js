const mangoose = require('mongoose');
const userCleanupTask = require('../tasks/userCleanupTask'); // Permet de lancer le cron job pour supprimer les utilisateurs non vérifiés
require('../tasks/cleanupExpiredSharesTask');

const connectDB = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await mangoose.connect(process.env.DB_URI);
      console.log('Connected to the database');
    } catch (error) {
      console.error('Error connecting to the database');
      console.error(error);
    }
  }
};

module.exports = connectDB;
