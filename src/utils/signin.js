const User = require('../database/models/user');
const argon2 = require('argon2');
const request = require('supertest');
const app = require('../server');

const sigin = async () =>  {
    const passwordHash = await argon2.hash('password123');

    const user = new User({
        firstname: 'John',
        lastname: 'Doe',
        pseudo: 'JohnDoe',
        email: 'johndoe@example.com',
        isVerified: true,
        password: passwordHash,
    });

    await user.save();

    const response = await request(app)
        .post('/signin')
        .send({ email: 'johndoe@example.com', password: 'password123' });

    if (response.statusCode == 400 ) {
        console.log("Echec de la création de l'utilisateur. : ");
    } else {
        console.log("Création de l'utilisateur réussie.");
    }

    return user._id;
}

module.exports = sigin;