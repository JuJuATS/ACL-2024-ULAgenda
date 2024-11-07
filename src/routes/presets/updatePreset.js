const Preset = require("../../database/models/preset");
const Recurrence = require("../../database/models/recurrence");

const updatePreset = async (req, res) => {
    try {
        const presetId = req.params.id;
        const {
            name,
            eventName,
            color,
            priority,
            duration,
            startHour,
            reminder,
            description,
            weekDays,
            monthDays,
            yearDays
        } = req.body;

        const preset = await Preset.findById(presetId);

        if (!preset) {
            return res.status(404).send("Préréglage non trouvé");
        }

        if (!preset.userId.equals(req.user.id)) {
            return res.status(403).send("Vous n'êtes pas autorisé à modifier ce préréglage");
        }

        if (name) {
            if (name.trim().length === 0) {
                req.flash('error', 'Le nom doit contenir au moins un caractère.');
                return res.redirect(req.path);
            }
            // On vérifie qu'aucun autre preset de l'utilisateur ne porte le même nom
            const existingPreset = await Preset.findOne({
                name : { $regex: new RegExp(`^${name.trim()}$`, 'i') }, // On ignore la casse
                userId: req.user.id,
                _id: { $ne: presetId }, // On exclut évidemment le préréglage actuel
            });
            if (existingPreset) {
                req.flash('error', `Vous avez déjà un préréglage nommé "${name.trim()}".`);
                return res.redirect(req.path);
            }
        }


        let recurrenceData = {
            weekDay: JSON.parse(weekDays || '[]'),
            monthDay: JSON.parse(monthDays || '[]'),
            yearDay: JSON.parse(yearDays || '[]'),
            dateDebut: new Date(),
        };

        // Si le preset a déjà une récurrence, la mettre à jour
        if (preset.recurrence) {
            await Recurrence.findByIdAndUpdate(preset.recurrence, recurrenceData);
        } else {
            // Sinon, en créer une nouvelle
            const newRecurrence = new Recurrence(recurrenceData);
            await newRecurrence.save();
            preset.recurrence = newRecurrence._id;
        }


        preset.name = name || preset.name;
        preset.eventName = eventName !== undefined ? eventName : preset.eventName;
        preset.color = color || preset.color;
        preset.priority = priority || preset.priority;
        preset.duration = duration || preset.duration;
        preset.startHour = startHour !== undefined ? startHour : preset.startHour;
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
