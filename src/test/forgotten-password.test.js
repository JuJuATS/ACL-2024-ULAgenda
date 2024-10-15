const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../database/models/user');
const argon2 = require('argon2');
const {createVerificationToken} = require("../utils/tokenGenerator");
let mongoServer;

describe("Test de la fonction de mot de passe oublié",()=>{
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
    it("test de la modification de mot de passe",async ()=>{

    const passwordHash = await argon2.hash('password123');

    const user = new User({
      firstname: 'John',
      lastname: 'Doe',
      pseudo: 'JohnDoe',
      email: 'johndoe@example.com',
      password: passwordHash,
    });
    const token = createVerificationToken(user);
    await user.save();
        const response = await request(app)
        .post('/reset-password')
        .send({ token:token, password: 'password1234' });
        const newUser = User.findById(1);
        except(newUser.password).toBe("password1234")
    })
    it("test de la redirection avec le code 400 en cas de mauvais token",async ()=>{

      await user.save();
          const response = await request(app)
          .post('/reset-password')
          .send({ token:token, password: 'password1234' });
          const newUser = User.findById(1);
          except(newUser.password).toBe("password1234")
      })
    it("test de la redirection 404 lorsque que l'adresse n'existe pas", async()=>{
      const response = await request(app)
      .post('/forgotten-password').send({mail:"toto@gmail.com"})
      except(response.statusCode).toBe(404);
    })
})