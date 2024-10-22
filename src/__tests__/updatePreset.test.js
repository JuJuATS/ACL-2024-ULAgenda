const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
const app = require('../server');
const Preset = require('../database/models/preset');
const User = require('../database/models/user');
const argon2 = require('argon2');

let mongoServer;
let server;

let presetId;
let userId;

const agent = supertest.agent(app);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    server = app.listen(3000, () => {
        console.log('Server is running on http://localhost:3000');
    });

    const mockUser = new User({
        firstname: 'Test',
        lastname: 'User',
        email: 'testuser@example.com',
        pseudo: 'testUser',
        password: await argon2.hash('password123'),
        isVerified: true,
    });
    await mockUser.save();
    userId = mockUser._id;

    const unauthorizedUser = new User({
        firstname: 'Unauthorized',
        lastname: 'User',
        email: 'unauthorized@example.com',
        pseudo: 'unauthUser',
        password: await argon2.hash('password123'),
        isVerified: true,
    });
    await unauthorizedUser.save();

    // Log in the authorized user
    await agent.post('/signin').send({
        email: 'testuser@example.com',
        password: 'password123'
    });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    server.close();
});

beforeEach(async () => {
    const mockPreset = new Preset({
        name: 'Original Preset',
        userId: userId,
        color: '#ff0000',
        priority: 'Moyenne',
        recurrence: 'Hebdomadaire',
        duration: 60,
        description: 'Test description',
    });
    await mockPreset.save();
    presetId = mockPreset._id;
});

afterEach(async () => {
    await Preset.deleteMany({});
});


describe('Tests de la modification d\'un preset', () => {
    it('devrait mettre à jour le préréglage avec les données du formulaire', async () => {
        const updatedData = {
            name: 'Updated Preset',
            color: '#00ff00',
            priority: 'Haute',
            recurrence: 'Quotidienne',
            duration: 120,
            description: 'Updated description',
        };
    
        const response = await agent.put(`/presets/${presetId}`).send(updatedData);
    
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`/presets/${presetId}`);

        // Vérifier que le message flash est affiché
        const getResponse = await agent.get(response.headers.location);

        const $ = cheerio.load(getResponse.text);
        const flashMessage = $('.flash-message-success p').text();
        expect(flashMessage).toBe('Préréglage modifié avec succès.');
    

        const updatedPreset = await Preset.findById(presetId);
        expect(updatedPreset.name).toBe(updatedData.name);
        expect(updatedPreset.color).toBe(updatedData.color);
        expect(updatedPreset.priority).toBe(updatedData.priority);
        expect(updatedPreset.recurrence).toBe(updatedData.recurrence);
        expect(updatedPreset.duration).toBe(updatedData.duration);
        expect(updatedPreset.description).toBe(updatedData.description);

        // On vérifie que l'id de l'utilisateur n'a pas changé
        expect(updatedPreset.userId.toString()).toBe(userId.toString());
    });

    it('devrait mettre à jour uniquement les champs présents dans le formulaire, en laissant les autres inchangés', async () => {
        const partialData = {
            name: 'Partially Updated Preset',
            duration: 90,
            description: '',
        };
    
        const response = await agent.put(`/presets/${presetId}`).send(partialData);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`/presets/${presetId}`);

        const getResponse = await agent.get(response.headers.location);
        const $ = cheerio.load(getResponse.text);
        const flashMessage = $('.flash-message-success p').text();
        expect(flashMessage).toBe('Préréglage modifié avec succès.');

    
        // Les données du préréglage doivent être mises à jour avec les données partielles
        const updatedPreset = await Preset.findById(presetId);
        expect(updatedPreset.name).toBe(partialData.name);
        expect(updatedPreset.duration).toBe(partialData.duration);
    
        // Les données non présentes dans le formulaire de mise à jour doivent rester inchangées
        expect(updatedPreset.color).toBe('#ff0000');
        expect(updatedPreset.priority).toBe('Moyenne');
        expect(updatedPreset.recurrence).toBe('Hebdomadaire');
        expect(updatedPreset.description).toBe('');
        expect(updatedPreset.userId.toString()).toBe(userId.toString());
    });

    it('devrait n\'avoir aucun impact sur le préréglage si le formulaire est vide', async () => {
        const response = await agent.put(`/presets/${presetId}`).send({});
    
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`/presets/${presetId}`);
    
        const getResponse = await agent.get(response.headers.location);
        const $ = cheerio.load(getResponse.text);
        
        const flashMessage = $('.flash-message-success p').text();
        expect(flashMessage).toBe('Préréglage modifié avec succès.');
    
        const updatedPreset = await Preset.findById(presetId);
        expect(updatedPreset.name).toBe('Original Preset');
        expect(updatedPreset.color).toBe('#ff0000');
        expect(updatedPreset.priority).toBe('Moyenne');
        expect(updatedPreset.recurrence).toBe('Hebdomadaire');
        expect(updatedPreset.duration).toBe(60);
        expect(updatedPreset.description).toBe('Test description');
    });

    it('devrait ne pas mettre à jour le préréglage pour une durée négative et une récurrence invalide', async () => {
        const invalidData = {
            duration: -1,
            recurrence: 'invalidRecurrence',
        };

        const response = await agent.put(`/presets/${presetId}`).send(invalidData);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`/presets/${presetId}`);

        const getResponse = await agent.get(response.headers.location);
        const $ = cheerio.load(getResponse.text);
        const flashMessages = $('.flash-message-error p').toArray().map(el => $(el).text());
        expect(flashMessages.length).toBe(2);
        expect(flashMessages).toContain('La durée doit être une valeur positive.');
        expect(flashMessages).toContain('`invalidRecurrence` is not a valid enum value for path `recurrence`.');

        const preset = await Preset.findById(presetId);
        expect(preset.duration).toBe(60);
        expect(preset.recurrence).toBe('Hebdomadaire');
    });

    it('devrait ne pas mettre à jour le préréglage pour une durée supérieure à 24 heures', async () => {
        const invalidData = {
            duration: 1500, // Plus de 24 heures (1440 minutes)
        };

        const response = await agent.put(`/presets/${presetId}`).send(invalidData);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`/presets/${presetId}`);

        const getResponse = await agent.get(response.headers.location);
        const $ = cheerio.load(getResponse.text);
        const flashMessage = $('.flash-message-error p').text();
        expect(flashMessage).toBe('La durée doit être inférieure ou égale à 1440 minutes (24 heures).');

        const preset = await Preset.findById(presetId);
        expect(preset.duration).toBe(60);
    });

    it('devrait renvoyer une erreur 403 si un utilisateur non autorisé tente de mettre à jour un préréglage', async () => {
        const updatedData = {
            name: 'Unauthorized Update',
        };

        // Connexion de l'utilisateur non autorisé
        const unauthorizedAgent = supertest.agent(app);
        await unauthorizedAgent.post('/signin').send({
            email: 'unauthorized@example.com',
            password: 'password123'
        });

        const response = await unauthorizedAgent.put(`/presets/${presetId}`).send(updatedData);

        expect(response.status).toBe(403);
    });

    it('devrait renvoyer une erreur 404 si l\'id du préréglage n\'existe pas', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const updatedData = {
            name: 'Non-existent Preset',
        };

        const response = await agent.put(`/presets/${nonExistentId}`).send(updatedData);

        expect(response.status).toBe(404);
    });

    it('devrait renvoyer une erreur si un autre preset de l\'utilisateur porte déjà le même nom (pas de sensibilité à la casse)', async () => {
        // Créer un deuxième preset pour l'utilisateur
        const secondPreset = new Preset({
            name: 'Second Preset',
            userId: userId,
            color: '#0000ff',
            priority: 'Basse',
            recurrence: 'Mensuelle',
            duration: 30,
            description: 'Second preset description',
        });
        await secondPreset.save();

        // Essayer de mettre à jour le premier preset avec le nom du deuxième preset
        const updatedData = {
            name: 'second Preset',
        };

        const response = await agent.put(`/presets/${presetId}`).send(updatedData);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`/presets/${presetId}`);

        const getResponse = await agent.get(response.headers.location);
        const $ = cheerio.load(getResponse.text);
        const flashMessage = $('.flash-message-error p').text();
        expect(flashMessage).toBe('Vous avez déjà un préréglage nommé "second Preset".');

        const preset = await Preset.findById(presetId);
        expect(preset.name).toBe('Original Preset');
    });
});
