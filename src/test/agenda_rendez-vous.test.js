const signin = require('../utils/signin.js');
const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Agenda = require('../database/models/agenda');
const User = require('../database/models/user');
const argon2 = require('argon2');
const ObjectId = require('mongodb').ObjectId;

let mongoServer;

describe("Test de l'ajout d'un agenda", () => {
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
  it("Test de l'ajout d'un agenda", async () => {
      // Créer un utilisateur avec un mot de passe hashé
    const passwordHash = await argon2.hash('password123');
    const user = new User({
      firstname: 'John',
      lastname: 'Doe',
      pseudo: 'JohnDoe',
      email: 'johndoe@example.com',
      isVerified:true,
      password: passwordHash,
    });
    await user.save();

    // Effectuer une requête POST pour simuler le login
    const r = await request(app)
      .post('/signin')
      .send({ email: 'johndoe@example.com', password: 'password123' });

    expect(r.statusCode).toBe(302); // Vérifier la redirection
    expect(r.headers.location).toBe('/'); // Vérifier la redirection vers "/"

      const name = 'agendaTest';

      const response = await request(app)
        .post('/agendas')
        .send({ name: name });

      console.log("Response: ", response.body);

      const agendaAdded = await Agenda.findOne({ name: name });

      console.log("Neil : ", agendaAdded);

      expect(agendaAdded).not.toBeNull();
      expect(agendaAdded.name).toBe(name);
  });
});