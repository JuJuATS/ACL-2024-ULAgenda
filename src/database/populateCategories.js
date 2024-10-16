const Category = require('./models/category');

// Catégories globales avec personnalisations
const globalCategories = [
    {
        name: 'Travail',
        color: '#ff0000',
        isGlobal: true,
        priority: 'Haute',               
        visibility: 'Public',              
        recurrence: 'Aucune',              
        defaultDuration: 60,
    },
    {
        name: 'Loisir',
        color: '#00ff00',
        isGlobal: true,
        priority: 'Moyenne',
        visibility: 'Public',
        recurrence: 'Aucune',
        defaultDuration: 120,
    },
    {
        name: 'Famille',
        color: '#0000ff',
        isGlobal: true,
        priority: 'Moyenne',
        visibility: 'Public',
        recurrence: 'Aucune',
        defaultDuration: 90,
    },
    {
        name: 'Santé',
        color: '#ff00ff',
        isGlobal: true,
        priority: 'Haute',
        visibility: 'Privé',
        recurrence: 'Aucune',
        defaultDuration: 30,
    },
    {
        name: 'Personnel',
        color: '#ffa500',
        isGlobal: true,
        priority: 'Basse',
        visibility: 'Privé',
        recurrence: 'Aucune',
        defaultDuration: 60,
    },
];

// Fonction pour peupler les catégories globales
const populateCategories = async () => {
    try {
        const existingCategories = await Category.find({ isGlobal: true });

        if (existingCategories.length === 0) {
            // Si aucune catégorie globale n'existe, on les ajoute
            await Category.insertMany(globalCategories);
            console.log('Catégories globales ajoutées avec succès !');
        } else {
            console.log('Les catégories globales existent déjà.');
        }
    } catch (error) {
        console.error('Erreur lors de la création des catégories globales :', error);
    }
};

module.exports = populateCategories;
