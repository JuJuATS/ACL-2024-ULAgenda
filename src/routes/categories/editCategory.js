const Category = require('../../database/models/category');
const User = require('../../database/models/user');

const editCategory = async (req, res) => {
    const { categoryId } = req.params;

    try {
        const user = await User.findById(req.session.user.id).populate('personalCategories.category');

        // Récupérer la catégorie (globale ou personnelle)
        let category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).send('Catégorie introuvable');
        }

        // Si la catégorie est globale, chercher une éventuelle personnalisation
        if (category.isGlobal) {
            const personalization = user.globalCategoryPersonalizations.find(p => p.categoryId.equals(categoryId));

            if (personalization) {
                // Fusionner les personnalisations avec la catégorie globale
                category = {
                    ...category.toObject(),
                    color: personalization.personalizations.color || category.color,
                    priority: personalization.personalizations.priority || category.priority,
                    visibility: personalization.personalizations.visibility || category.visibility,
                    recurrence: personalization.personalizations.recurrence || category.recurrence,
                    defaultDuration: personalization.personalizations.defaultDuration || category.defaultDuration,
                }
                console.log(category);
            }
        }

        // Si la catégorie est personnelle, s'assurer qu'elle appartient à l'utilisateur
        const personalCategory = user.personalCategories.find(c => c.category._id.equals(categoryId));

        if (!category.isGlobal && !personalCategory) {
            return res.status(403).send("Vous n'avez pas l'autorisation de modifier cette catégorie.");
        }

        // Afficher le formulaire de modification
        res.render('edit-category', {
            category,
        });
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération de la catégorie');
        console.error('Erreur lors de la récupération de la catégorie :', error);
    }
};

module.exports = editCategory;
