const Preset = require('../../database/models/preset');

const getPresetEditionPage = async (req, res) => {
    try {
        const presetId = req.params.id;
        const userId = req.user.id;
        const isNewPreset = req.query.new === 'true';

        const preset = await Preset.findById(presetId)
            .populate('recurrence')
            .exec();

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
            eventName: preset.eventName || '',
            color: preset.color,
            priority: preset.priority,
            recurrence: {
                weekDays: preset.recurrence?.weekDay || [],
                monthDays: preset.recurrence?.monthDay || [],
                yearDays: preset.recurrence?.yearDay || [],
                endDate: preset.recurrence?.dateFin || null,
            },
            startHour: preset.startHour || '',
            duration: preset.duration,
            reminder: preset.reminder || '',
            description: preset.description || '',
            isNewPreset,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du préréglage:', error);
        req.flash('error', 'Une erreur est survenue lors de la récupération du préréglage.');
        res.redirect('/presets');
    }
};

module.exports = getPresetEditionPage;
