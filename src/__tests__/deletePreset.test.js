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

// Mock Data for testing
let presetId;
let userId;
let otherUserId;

const agent = supertest.agent(app);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    server = app.listen(3000, () => {
        console.log('Server is running on http://localhost:3000');
    });

    // Create a mock user
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

    // Create another mock user (to test 403 Forbidden)
    const otherUser = new User({
        firstname: 'Other',
        lastname: 'User',
        email: 'otheruser@example.com',
        pseudo: 'otherUser',
        password: await argon2.hash('password456'),
        isVerified: true,
    });
    await otherUser.save();
    otherUserId = otherUser._id;

    // Sign in the mock user
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
        name: 'Preset to Delete',
        userId: userId,
        color: '#ff0000',
        priority: 'Moyenne',
        recurrence: 'Hebdomadaire',
        duration: 60,
        description: 'Test description for delete',
    });
    await mockPreset.save();
    presetId = mockPreset._id;
});

afterEach(async () => {
    await Preset.deleteMany({});
});

describe('Delete Preset Feature', () => {
    
    it('should return 404 if preset ID does not exist', async () => {
        const nonExistentId = new mongoose.Types.ObjectId(); // Créer un ID aléatoire
        
        const response = await agent.delete(`/presets/${nonExistentId}`);

        expect(response.status).toBe(404);
        expect(response.text).toBe('Preset not found');
    });

    it('should return 403 if the preset belongs to another user', async () => {
        // Création d'un preset appartenant à otherUser
        const otherUserPreset = new Preset({
            name: 'Other User Preset',
            userId: otherUserId,
            color: '#00ff00',
            priority: 'Basse',
            recurrence: 'Mensuelle',
            duration: 30,
            description: 'Preset belonging to another user',
        });
        await otherUserPreset.save();

        const response = await agent.delete(`/presets/${otherUserPreset._id}`);

        expect(response.status).toBe(403);
        expect(response.text).toBe('Unauthorized to delete this preset');
    });

    it('should delete the preset if it exists and belongs to the current user', async () => {
        const response = await agent.delete(`/presets/${presetId}`);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`/presets`);

        const getResponse = await agent.get(response.headers.location);
        const $ = cheerio.load(getResponse.text);
        const flashMessage = $('.flash-message-success p').text();
        expect(flashMessage).toBe(`Votre préréglage 'Preset to Delete' à été supprimé.`);

        const deletedPreset = await Preset.findById(presetId);
        expect(deletedPreset).toBeNull();
    });
});
