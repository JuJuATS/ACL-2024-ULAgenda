const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../database/models/user');
const argon2 = require('argon2');
require('dotenv').config();

let mongoServer;
describe('Tests de la fonction de login', () => {
  beforeAll(async () => {
    // Démarrer le serveur MongoDB en mémoire
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    console.log(mongoUri)
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


  it('devrait rediriger vers "/" [pseudo]" pour un utilisateur valide', async () => {
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
    const response = await request(app)
      .post('/signin')
      .send({ email: 'johndoe@example.com', password: 'password123' });

    expect(response.statusCode).toBe(302); // Vérifier la redirection
    expect(response.headers.location).toBe('/'); // Vérifier la redirection vers "/"
  });


  it('devrait retourner 400 si l\'email n\'existe pas', async () => {
    const response = await request(app)
      .post('/signin')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(response.statusCode).toBe(400);
  });


  it('devrait retourner 400 si le mot de passe est incorrect', async () => {
    // Créer un utilisateur
    const passwordHash = await argon2.hash('password123');
    const user = new User({
      firstname: 'Jane',
      lastname: 'Doe',
      pseudo: 'JaneDoe',
      email: 'janedoe@example.com',
      isVerified:true,
      password: passwordHash,
    });
    await user.save();

    // Simuler une connexion avec un mot de passe incorrect
    const response = await request(app)
      .post('/signin')
      .send({ email: 'janedoe@example.com', password: 'wrongpassword' });

    expect(response.statusCode).toBe(400); 
  });


  it('devrait retourner 400 avec le message "Email ou mot de passe manquant" si l\'email ou le mot de passe est manquant', async () => {
    // Cas où l'email seul est manquant
    const responseEmailMissing = await request(app)
      .post('/signin')
      .send({ password: 'password123' });

    expect(responseEmailMissing.statusCode).toBe(400);


    // Cas où le mot de passe seul est manquant
    const responsePasswordMissing = await request(app)
      .post('/signin')
      .send({ email: 'johndoe@example.com' });

    expect(responsePasswordMissing.statusCode).toBe(400);

    // Cas où l'email et le mot de passe sont manquants
    const responseBothMissing = await request(app)
      .post('/signin')
      .send({});

    expect(responseBothMissing.statusCode).toBe(400);
    
  });
  it("devrait retourner 400 avec le message 'compte non verifié si le compte n'est pas valide",async()=>{
        // Créer un utilisateur
        const passwordHash = await argon2.hash('password123');
        const user = new User({
          firstname: 'Jane',
          lastname: 'Doe',
          pseudo: 'JaneDoe',
          email: 'janedoe@example.com',
          isVerified:false,
          password: passwordHash,
        });
        await user.save();
        const response  = await request(app)
  })
});
