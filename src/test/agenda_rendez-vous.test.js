const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Agenda = require('../database/models/agenda');
const ObjectId = require('mongodb').ObjectId;
const signin = require('../utils/signin.js');

let mongoServer;

describe("Test de l'ajout d'un agenda",()=>{
    beforeAll(async () => {
        // Démarrer le serveur MongoDB en mémoire
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Connexion à la base de données en mémoire
        await mongoose.connect(process.env.DB_URI);
      });

      afterEach(async () => {
        // Nettoyer toutes les collections après chaque test
        await mongoose.connection.db.dropDatabase();
      });

      afterAll(async () => {
        // Déconnexion et fermeture du serveur MongoDB en mémoire
        await mongoose.disconnect();
        //await mongoServer.stop();
    });

    // Test de l'ajout d'un agenda.
    it("Test de l'ajout d'un agenda", async() => {
      // Simule un utilisateur connecté.
      const userId = ObjectId.createFromTime(signin());

      const name = 'agendaTest'; 
      
      const response = await request(app)
        .post('/agendas')
        .send({ name: name });

      const agendaAdded = await Agenda.findOne({ name, userId });
      expect(agendaAdded.name).toBe(name);
    });

    /*
    // Test de l'ajout d'un rendez-vous.
    it("Test de l'ajout d'un rendez-vous", async() => {
      
    });
    */
})