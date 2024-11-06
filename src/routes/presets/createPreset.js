const Preset = require('../../database/models/preset');

const generateUniqueName = async (baseName, userId) => {
    let name = baseName;
    let count = 1;

    while (await Preset.exists({ name, userId })) {
        count++;
        name = `${baseName} ${count}`;
    }

    return name;
}

const createPreset = async (req, res) => {
    try {
        // Générer un nom unique basé sur "Nouveau Préréglage"
        const baseName = 'Nouveau Préréglage';
        const uniqueName = await generateUniqueName(baseName, req.user.id);

        const newPreset = new Preset({
            userId: req.user.id,
            name: uniqueName,
        });

        // Sauvegarder le nouveau préréglage
        await newPreset.save();

        // Rediriger l'utilisateur vers la page d'édition du préréglage nouvellement créé
        res.redirect(`/presets/${newPreset._id}?new=true`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la création du préréglage.');
    }
}

module.exports = createPreset;
