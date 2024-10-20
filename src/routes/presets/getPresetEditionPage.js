const Preset = require('../../database/models/preset');

const getPresetEditionPage = async (req, res) => {
    try {
        const presetId = req.params.id;
        const userId = req.session.userId;

        const preset = await Preset.findById(presetId);

        if (!preset) {
            req.flash('error', 'Préréglage non trouvé.');
            return res.redirect('/presets');
        }

        if (!preset.userId.equals(userId)) {
            req.flash('error', 'Vous n\'êtes pas autorisé à modifier ce préréglage.');
            return res.redirect('/presets');
        }

        res.render('presets/edit', {
            id: preset._id,
            name: preset.name,
            color: preset.color,
            priority: preset.priority,
            recurrence: preset.recurrence,
            duration: preset.duration,
            description: preset.description || '',
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du préréglage:', error);
        req.flash('error', 'Une erreur est survenue lors de la récupération du préréglage.');
        res.redirect('/presets');
    }
};

module.exports = getPresetEditionPage;
