const Category = require('../../database/models/category');
const User = require('../../database/models/user');

const getCategories = async (req, res) => {
    try {
        // Récupérer l'utilisateur connecté avec les références de ses catégories personnelles et ses personnalisations de catégories globales
        const user = await User.findById(req.session.user.id)
            .populate('personalCategories')  // Charger les catégories personnelles via leur référence
            .exec();

        // Récupérer les catégories globales
        const globalCategories = await Category.find({ isGlobal: true });

        // Appliquer les personnalisations de l'utilisateur aux catégories globales
        const personalizedGlobalCategories = globalCategories.map(globalCategory => {
            // Chercher les personnalisations de l'utilisateur pour cette catégorie globale
            const personalization = user.globalCategoryPersonalizations.find(p =>
                p.categoryId.equals(globalCategory._id)
            );

            if (personalization) {
                // Appliquer les personnalisations si elles existent
                return {
                    ...globalCategory.toObject(),
                    color: personalization.personalizations.color || globalCategory.color,
                    priority: personalization.personalizations.priority || globalCategory.priority,
                    visibility: personalization.personalizations.visibility || globalCategory.visibility,
                    recurrence: personalization.personalizations.recurrence || globalCategory.recurrence,
                    defaultDuration: personalization.personalizations.defaultDuration || globalCategory.defaultDuration,
                };
            } else {
                // Sinon, garder les valeurs par défaut de la catégorie globale
                return globalCategory.toObject();
            }
        });

        // Récupérer les catégories personnelles de l'utilisateur
        const personalCategories = user.personalCategories;

        // Rendre la page avec les catégories globales et personnelles
        res.render('manage-categories', {
            globalCategories: personalizedGlobalCategories,
            personalCategories,
        });
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des catégories');
        console.error('Erreur lors de la récupération des catégories:', error);
    }
};

module.exports = getCategories;
