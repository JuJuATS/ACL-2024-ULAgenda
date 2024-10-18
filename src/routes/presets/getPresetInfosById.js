const Preset = require('../../database/models/preset');

const getPresetInfosById = async (req, res) => {
    try {
        const presetId = req.params.id;

        const preset = await Preset.findById(presetId);

        if (!preset) {
            return res.status(404).json({ message: 'Preset non trouvé' });
        }

        if (!preset.userId.equals(req.session.userId)) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à ce préréglage' });
        }

        res.json(preset);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des informations du préréglage' });
    }
}

module.exports = getPresetInfosById;
