const Preset = require('../../database/models/preset');

const getPresets = async (req, res) => {
    try {
        const presets = await Preset.find({ userId: req.user.id })
            .populate('recurrence')
            .exec();

        res.render('presets/index', { presets });
    } catch (error) {
        res.status(500).send("Erreur lors de la récupération des presets");
    }
}

module.exports = getPresets;
