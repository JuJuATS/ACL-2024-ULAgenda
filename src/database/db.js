const mangoose = require('mongoose');

const connectDB = async () => {
  try {
    await mangoose.connect('mongodb://localhost:27017/db_ulagenda');

    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database');
    console.error(error);
  }
};

module.exports = connectDB;
