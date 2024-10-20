const Preset = require('../../database/models/preset');

const deletePreset = async (req, res) => {
    try {
        const presetId = req.params.id;
        const userId = req.session.userId;

        const preset = await Preset.findById(presetId);

        if (!preset) {
            return res.status(404).send('Preset not found');
        }

        if (!preset.userId.equals(userId)) {
            return res.status(403).send('Unauthorized to delete this preset');
        }

        await Preset.findByIdAndDelete(presetId);

        req.flash('success', `Votre préréglage '${preset.name}' à été supprimé.`);
        res.redirect('/presets');
    } catch (error) {
        console.error('Error deleting preset:', error);
        req.flash('error', 'Une erreur est survenue lors de la supression du préréglage.');
        res.redirect(req.path);
    }
};

module.exports = deletePreset;
