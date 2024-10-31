const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../database/models/user');
const argon2 = require('argon2');
const createVerificationToken = require('../utils/createVerificationToken');
const { sendVerificationEmail } = require('../utils/mailer');


// Mock la fonction sendVerificationEmail
jest.mock('../utils/mailer', () => ({
  sendVerificationEmail: jest.fn(),
}));


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
  it('devrait créer un compte et rediriger vers /', async () => {
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
    expect(response.headers.location).toBe('/');

    // Vérifier que l'utilisateur est bien dans la base de données
    const userInDb = await User.findOne({ email: 'john.doe@example.com' });
    expect(userInDb).not.toBeNull();
    expect(userInDb.pseudo).toBe('JohnDoe');

    // Véfifier que le compte n'est pas encore vérifié
    expect(userInDb.isVerified).toBe(false);

    // Vérifier que l'email de vérification a été envoyé
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
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



describe('Email Verification', () => {
  let validUser;
  let validToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    validUser = new User({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
      pseudo: 'JohnDoe',
      password: 'hashedPassword123',
      isVerified: false,
    });
    await validUser.save();

    // Créer un token JWT valide pour cet utilisateur
    validToken = createVerificationToken(validUser);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Test 1 : L'utilisateur est trouvé et le token est valide
  it('devrait vérifier l’email de l’utilisateur avec un token valide', async () => {
    const res = await request(app)
      .get(`/verify-email?token=${validToken}`)
      .expect(200);

    expect(res.text).toBe('Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.');

    // Vérifie que l'utilisateur est bien marqué comme vérifié
    const updatedUser = await User.findById(validUser._id);
    expect(updatedUser.isVerified).toBe(true);
  });

  // Test 2 : L'utilisateur est déjà vérifié
  it('devrait retourner un message si l’email est déjà vérifié', async () => {
    validUser.isVerified = true;
    await validUser.save();

    const res = await request(app)
      .get(`/verify-email?token=${validToken}`)
      .expect(200);

    expect(res.text).toBe('Email déjà vérifié.');
  });

  // Test 3 : L'utilisateur n'est pas trouvé
  it("devrait retourner une erreur si l'utilisateur n'est pas trouvé", async () => {
    const fakeToken = createVerificationToken({ _id: new mongoose.Types.ObjectId(), email: 'fakemail@gmail.com' });

    const res = await request(app)
      .get(`/verify-email?token=${fakeToken}`)
      .expect(400);

    expect(res.text).toBe('Utilisateur non trouvé');
  });

  // Test 4 : Le token est invalide ou expiré
  it('devrait retourner une erreur si le token est invalide ou expiré', async () => {
    const invalidToken = 'invalidToken123';

    const res = await request(app)
      .get(`/verify-email?token=${invalidToken}`)
      .expect(400);

    expect(res.text).toBe('Token invalide ou expiré.');
  });
});
