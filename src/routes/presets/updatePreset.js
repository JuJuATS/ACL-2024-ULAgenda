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
            reminder,
            description
        } = req.body;

        const preset = await Preset.findById(presetId);

        if (!preset) {
            return res.status(404).send("Préréglage non trouvé");
        }

        if (!preset.userId.equals(req.session.userId)) {
            return res.status(403).send("Vous n'êtes pas autorisé à modifier ce préréglage");
        }

        // On vérifie qu'aucun autre preser de l'utilisateur ne porte le même nom
        const existingPreset = await Preset.findOne({
            name : { $regex: new RegExp(`^${name}$`, 'i') }, // On ignore la casse
            userId: req.session.userId,
            _id: { $ne: presetId }, // On exclut évidemment le préréglage actuel
        });
        if (existingPreset) {
            req.flash('error', `Vous avez déjà un préréglage nommé "${name}".`);
            return res.redirect(req.path);
        }

        preset.name = name || preset.name;
        preset.color = color || preset.color;
        preset.priority = priority || preset.priority;
        preset.recurrence = recurrence || preset.recurrence;
        preset.duration = duration || preset.duration;
        preset.reminder = reminder ? parseInt(reminder) : null;
        preset.description = description !== undefined ? description : preset.description;

        await preset.save();

        req.flash('success', 'Préréglage modifié avec succès.');
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            errorMessages.forEach(msg => req.flash('error', msg));
        } else {
            console.error(error);
            req.flash('error', 'Une erreur est survenue lors de la mise à jour du préréglage.');
        }
    }
    res.redirect(req.path);
}

module.exports = updatePreset;
