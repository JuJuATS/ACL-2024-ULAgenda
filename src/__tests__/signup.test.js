const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../database/models/user');
const argon2 = require('argon2');

let mongoServer;

describe('Tests de la route POST /signup', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Fermer MongoDB et déconnecter Mongoose
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Nettoyer la base de données après chaque test
    await mongoose.connection.db.dropDatabase();
  });

  // Cas 1: Succès de l'inscription
  it('devrait créer un compte et rediriger vers /successfull-signup', async () => {
    const userData = {
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
      pseudo: 'JohnDoe',
      password: 'Password123!',
    };

    const response = await request(app)
      .post('/signup')
      .send(userData);

    // Vérifier la redirection
    expect(response.statusCode).toBe(302); // Code 302 = redirection
    expect(response.headers.location).toBe('/successfull-signup');

    // Vérifier que l'utilisateur est bien dans la base de données
    const userInDb = await User.findOne({ email: 'john.doe@example.com' });
    expect(userInDb).not.toBeNull();
    expect(userInDb.pseudo).toBe('JohnDoe');

    // Véfifier que le compte n'est pas encore vérifié
    expect(userInDb.isVerified).toBe(false);
  });

  // Cas 2: Échec de l'inscription si des champs manquent
  it('devrait retourner une erreur 400 si un champ obligatoire est manquant', async () => {
    const userDataWithoutEmail = {
      nom: 'Doe',
      prenom: 'John',
      pseudo: 'JohnDoe',
      password: 'Password123!',
    };
    const userDataWithoutName = {
      prenom: 'John',
      pseudo: 'JohnDoe',
      email: 'john.doe@example.com',
      password: 'Password123!',
    };
    const userDataWithoutPassword = {
      nom: 'Doe',
      prenom: 'John',
      pseudo: 'JohnDoe',
      email: 'john.doe@example.com',
    };


    const response1 = await request(app)
      .post('/signup')
      .send(userDataWithoutName);
    const response2 = await request(app)
        .post('/signup')
        .send(userDataWithoutEmail);
    const response3 = await request(app)
        .post('/signup')
        .send(userDataWithoutPassword);

    expect(response1.statusCode).toBe(400);
    expect(response2.statusCode).toBe(400);
    expect(response3.statusCode).toBe(400);

    expect(response1.text).toBe('Tous les champs sont obligatoires');
    expect(response2.text).toBe('Tous les champs sont obligatoires');
    expect(response3.text).toBe('Tous les champs sont obligatoires');
  });

  // Cas 3: Échec si l'email est déjà utilisée
  it('devrait retourner une erreur si l\'email est déjà utilisée', async () => {
    // Inscrire un utilisateur de test
    const existingUser = new User({
      firstname: 'Jane',
      lastname: 'Doe',
      email: 'jane.doe@example.com',
      pseudo: 'JaneDoe',
      password: await argon2.hash('Password123!'),
    });
    await existingUser.save();

    const newUserData = {
      nom: 'Doe',
      prenom: 'John',
      email: 'jane.doe@example.com', // Email déjà utilisé
      pseudo: 'JohnDoe',
      password: 'Password123!',
    };

    const response = await request(app)
      .post('/signup')
      .send(newUserData);

    // Vérifier que la réponse indique que l'email existe déjà
    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Un compte existe déjà avec cette adresse email');
  });

  // Cas 4: Échec si le pseudo est déjà utilisé
  it('devrait retourner une erreur si le pseudo est déjà utilisé', async () => {
    // Inscrire un utilisateur de test
    const existingUser = new User({
      firstname: 'Jane',
      lastname: 'Doe',
      email: 'jane.doe@example.com',
      pseudo: 'JohnDoe', // Pseudo déjà pris
      password: await argon2.hash('Password123!'),
    });
    await existingUser.save();

    const newUserData = {
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com', // Email différent
      pseudo: 'JohnDoe', // Pseudo déjà pris
      password: 'Password123!',
    };

    const response = await request(app)
      .post('/signup')
      .send(newUserData);

    // Vérifier que la réponse indique que le pseudo est déjà pris
    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Ce pseudo est déjà utilisé');
  });
});
