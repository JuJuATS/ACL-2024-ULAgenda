let originalValues = null;
let isNewPreset = false;

function initializeValidation(initialValues, isNew) {
    originalValues = initialValues;
    isNewPreset = isNew;
}

function areSetsEqual(setA, setB) {
    if (setA.size !== setB.size) return false;
    return setA.size === 0 || [...setA].every(element => setB.has(element));
}

function checkIfModified(submitButton) {
    if (!originalValues || isNewPreset) return;

    const currentValues = {
        name: document.getElementById('name').value,
        color: document.getElementById('color').value,
        priority: document.getElementById('priority').value,
        duration: document.getElementById('duration').value,
        description: document.getElementById('description').value,
        eventName: document.getElementById('eventName').value,
        startHour: document.getElementById('startHour').value,
        reminder: document.getElementById('reminder').value,
        recurrence: {
            weekly: new Set(JSON.parse(document.getElementById('weekDays').value || '[]')),
            monthly: new Set(JSON.parse(document.getElementById('monthDays').value || '[]')),
            yearly: new Set(JSON.parse(document.getElementById('yearDays').value || '[]'))
        }
    };

    // Vérifier les champs simples
    const basicFieldsModified = Object.keys(originalValues).some(key => {
        if (key === 'recurrence') return false;
        return currentValues[key] !== originalValues[key];
    });

    // Vérifier les récurrences
    const recurrenceModified = ['weekly', 'monthly', 'yearly'].some(type => {
        const original = originalValues.recurrence[type];
        const current = currentValues.recurrence[type];
        return !areSetsEqual(original, current);
    });

    // Activer le bouton si au moins un changement est détecté
    submitButton.disabled = !basicFieldsModified && !recurrenceModified;
}

document.getElementById('deletePresetForm').addEventListener('submit', function(event) {
    if (!confirmDelete()) {
        event.preventDefault();
    }
});

function confirmDelete() {
    return confirm("Êtes-vous sûr de vouloir supprimer ce préréglage ?");
}

export {
    initializeValidation,
    checkIfModified,
    confirmDelete
};