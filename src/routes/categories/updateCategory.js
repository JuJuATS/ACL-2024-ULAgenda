const Category = require('../../database/models/category');
const User = require('../../database/models/user');

const updateCategory = async (req, res) => {
    const { categoryId } = req.params; // ID de la catégorie à modifier
    const { name, color, priority, visibility, recurrence, defaultDuration } = req.body;

    try {
        const user = await User.findById(req.session.user.id);
        // Vérifier si la catégorie à éditer est globale ou personnelle
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ type: 'error', message: 'Catégorie introuvable' });
        }

        // On vérifie que les champs obligatoires sont bien renseignés
        if ((!category.isGlobal && !name) || !color || !priority || !visibility || !recurrence || !defaultDuration) {
            return res.status(400).json({ type: 'error', message: 'Des champs obligatoires sont manquants' });
        }

        // Cas d'une catégorie globale (on personnalise)
        if (category.isGlobal) {
            const personalization = user.globalCategoryPersonalizations.find(p => p.categoryId.equals(categoryId));
            
            // Récupérer les valeurs par défaut de la catégorie globale
            const defaultValues = {
                color: category.color,
                priority: category.priority,
                visibility: category.visibility,
                recurrence: category.recurrence,
                defaultDuration: category.defaultDuration,
            };

            // On ne stocke que les champs dont les valeurs diffèrent de celles par défaut
            const newPersonalizations = Object.keys(defaultValues).reduce((acc, key) => {
                const value = key === 'defaultDuration' ? parseInt(req.body[key]) : req.body[key];
                if (value !== defaultValues[key]) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            
            if (Object.keys(newPersonalizations).length === 0) {
                // Si aucune valeur n'est redéfinie, on supprime la personnalisation correspondante
                user.globalCategoryPersonalizations = user.globalCategoryPersonalizations.filter(p => !p.categoryId.equals(categoryId));
            }

            // Si des personnalisations ont été définies, les mettre à jour ou les ajouter
            if (Object.keys(newPersonalizations).length > 0) {
                if (personalization) {
                    // Mise à jour des personnalisations existantes
                    personalization.personalizations = {};
                    Object.assign(personalization.personalizations, newPersonalizations);
                } else {
                    // Ajout d'une nouvelle personnalisation si elle n'existe pas
                    user.globalCategoryPersonalizations.push({
                        categoryId: categoryId,
                        personalizations: newPersonalizations,
                    });
                }

            
            }

            // Sauvegarde des personnalisations de l'utilisateur
            await user.save();

        } else {
            // Cas d'une catégorie personnelle (propre à l'utilisateur)
            category.name = name;
            category.color = color;
            category.priority = priority;
            category.visibility = visibility;
            category.recurrence = recurrence;
            category.defaultDuration = defaultDuration;

            await category.save();
        }

        res.json({ type: 'success', message: 'Catégorie mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ type: 'error', message: 'Erreur lors de la mise à jour de la catégorie' });
        console.error('Erreur lors de la mise à jour de la catégorie :', error);
    }
};

module.exports = updateCategory;
