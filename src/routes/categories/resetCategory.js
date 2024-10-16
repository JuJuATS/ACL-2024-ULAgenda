const Category = require('../../database/models/category');
const User = require('../../database/models/user');

const resetCategory = async (req, res) => {
    const { categoryId } = req.params; // ID de la catégorie globale à réinitialiser

    try {
        const user = await User.findById(req.session.user.id);

        // Vérifier si la catégorie est bien une catégorie globale
        const globalCategory = await Category.findById(categoryId);

        if (!globalCategory || !globalCategory.isGlobal) {
            return res.status(404).json({ error: 'Catégorie globale introuvable' });
        }

        // Supprimer la personnalisation de cette catégorie pour cet utilisateur
        const personalizationIndex = user.globalCategoryPersonalizations.findIndex(
            p => p.categoryId.equals(categoryId)
        );

        if (personalizationIndex !== -1) {
            // Supprimer la personnalisation de la liste
            user.globalCategoryPersonalizations.splice(personalizationIndex, 1);
            await user.save();
        }

        // Renvoyer les valeurs par défaut de la catégorie globale
        const defaultValues = {
            color: globalCategory.color,
            priority: globalCategory.priority,
            visibility: globalCategory.visibility,
            recurrence: globalCategory.recurrence,
            defaultDuration: globalCategory.defaultDuration,
        };

        // Répondre avec succès et envoyer les valeurs par défaut de la catégorie globale
        return res.json({ success: true, defaultValues });

    } catch (error) {
        console.error('Erreur lors de la réinitialisation de la catégorie :', error);
        return res.status(500).json({ error: 'Erreur lors de la réinitialisation de la catégorie' });
    }
};

module.exports = resetCategory;
