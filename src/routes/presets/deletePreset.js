const Preset = require('../../database/models/preset');

const deletePreset = async (req, res) => {
    try {
        const id = req.params.id;

        const preset = await Preset.findById(id);
        if (!preset) {
            return res.status(404).send("Preset non trouvé");
        }

        if (!preset.userId.equals(req.session.userId)) {
            return res.status(403).send("Vous n'êtes pas autorisé à supprimer ce preset");
        }

        await preset.remove();

        res.status(204).send();
    } catch (error) {
        res.status(500).send("Erreur lors de la suppression du preset");
    }
}

module.exports = deletePreset;
