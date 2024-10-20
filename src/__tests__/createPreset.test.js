const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../server'); 
const User = require('../database/models/user');
const Preset = require('../database/models/preset');
const argon2 = require('argon2');

let mockUserId;
let server;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  server = app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });

  // Création d'un utilisateur de test
  const mockUser = new User({
    firstname: 'Test',
    lastname: 'User',
    pseudo: 'testuser',
    email: 'testuser@example.com',
    password: await argon2.hash('password'),
    isVerified: true,
  });
  
  await mockUser.save();
  mockUserId = mockUser._id;
});

afterAll(async () => {
  // Nettoyage de la base de données et arrêt du serveur
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  server.close();
});

afterEach(async () => {
  await Preset.deleteMany({});
});

describe('Authenticated user preset creation tests', () => {
  it('should redirect unauthenticated users to /signin', async () => {
    const response = await supertest(app).get('/presets/new');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/signin');
  });

  it('should allow authenticated users to create a new preset with default schema values', async () => {
    const agent = supertest.agent(app); // Création d'un agent Supertest pour conserver les données de session

    // Simulation d'unne connexion de l'utilisateur
    const loginResponse = await agent.post('/signin').send({
      email: 'testuser@example.com',
      password: 'password',
    });

    // On s'assure que la connexion a réussi et que le cookie de session est défini
    expect(loginResponse.status).toBe(302);
    expect(loginResponse.headers['set-cookie']).toBeDefined();

    const response = await agent.get('/presets/new');

    expect(response.status).toBe(302); // On s'attend à une redirection après la création du préréglage
    expect(response.headers.location).toMatch(/\/presets\/[0-9a-fA-F]{24}/);

    // On vérifie que le préréglage a bien été créé
    const presetLocation = response.headers.location;
    const presetId = presetLocation.split('/').pop(); // Extraction de l'ID du préréglage
    const preset = await Preset.findById(presetId); // Réception du préréglage depuis la base de données

    expect(preset).not.toBeNull();

    // On vérifie que le préset a bien les valeurs par défaut
    expect(preset.name).toBe('Nouveau Préréglage');
    expect(preset.userId.toString()).toBe(mockUserId.toString());
    expect(preset.color).toBe('#0000cd');
    expect(preset.priority).toBe('Moyenne');
    expect(preset.recurrence).toBe('Aucune');
    expect(preset.duration).toBe(60);
    expect(preset.description).toBeUndefined();
  });

  it('should create a preset with incremented name if "Nouveau Préréglage" already exists', async () => {
    const agent = supertest.agent(app);
    
    const loginResponse = await agent.post('/signin').send({
      email: 'testuser@example.com',
      password: 'password',
    });

    expect(loginResponse.status).toBe(302);
    expect(loginResponse.headers['set-cookie']).toBeDefined();

    await agent.get('/presets/new');

    // Création d'un deuxième préréglage directement après le premier
    const response = await agent.get('/presets/new');

    expect(response.status).toBe(302);
    const presetLocation = response.headers.location;
    expect(presetLocation).toMatch(/\/presets\/[0-9a-fA-F]{24}/);

    // Vérification que le préréglage a bien été créé avec un nom incrémenté
    const presetId = presetLocation.split('/').pop();
    const newPreset = await Preset.findById(presetId);
    expect(newPreset.name).toBe('Nouveau Préréglage 2'); // Le nom du préréglage doit être incrémenté
  });
});
