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
    } catch (error) {
        console.error(error);
        req.flash('error', 'Une erreur est survenue lors de la mise à jour du préréglage.');
    }
    res.redirect(req.path);
}

module.exports = updatePreset;
