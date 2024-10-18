const Preset = require("../../database/models/preset");

const updatePreset = async (req, res) => {
    try {
        const presetId = req.params.id;
        const {
            name,
            color,
            priority,
            recurrence,
            duration,
            description
        } = req.body;

        const preset = await Preset.findById(presetId);

        if (!preset) {
            return res.status(404).send("Préréglage non trouvé");
        }

        if (!preset.userId.equals(req.session.userId)) {
            return res.status(403).send("Vous n'êtes pas autorisé à modifier ce préréglage");
        }

        preset.name = name || preset.name;
        preset.color = color || preset.color;
        preset.priority = priority || preset.priority;
        preset.recurrence = recurrence || preset.recurrence;
        preset.duration = duration || preset.duration;
        preset.description = description || preset.description;

        await preset.save();

        req.flash('success', 'Préréglage modifié avec succès.');
        res.redirect(`/presets/${presetId}`);
    } catch (error) {
        res.status(500).send("Erreur lors de la modification du preset");
        console.error(error);
    }
}

module.exports = updatePreset;
