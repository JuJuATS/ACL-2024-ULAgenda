import { 
    initializeRecurrenceHandlers,
    initializeRecurrenceData,
    updateHiddenFields, 
    updateRecurrenceSummary, 
    updateYearlyDatesList 
} from './recurrence-handlers.js';
import { initializeValidation, checkIfModified } from './form-validation.js';
import { initializeModal } from './modal-handlers.js';

let recurrenceData = {};

document.addEventListener('DOMContentLoaded', () => {
    const presetForm = document.getElementById('presetForm');
    const submitButton = presetForm.querySelector('button[type="submit"]');
    const returnLink = document.getElementById('returnLink');
    const presetDataEl = document.getElementById('preset-data');

    const originalValues = {
        name: presetDataEl.dataset.name,
        color: presetDataEl.dataset.color,
        priority: presetDataEl.dataset.priority,
        duration: presetDataEl.dataset.duration,
        description: presetDataEl.dataset.description,
        eventName: presetDataEl.dataset.eventName,
        startHour: presetDataEl.dataset.startHour,
        reminder: presetDataEl.dataset.reminder,
        recurrence: {
            weekly: new Set(),
            monthly: new Set(),
            yearly: new Set(),
            endDate: ''
        }
    };

    if (presetDataEl.dataset.isNew !== 'true') {
        submitButton.disabled = true; // Désactiver le bouton de soumission par défaut si le préréglage n'est pas nouveau
    }
    initializeRecurrenceHandlers(submitButton);
    
    recurrenceData = JSON.parse(presetDataEl.dataset.recurrence || '{}');
    if (recurrenceData) {
        initializeRecurrenceData(recurrenceData);
        initializeRecurrenceInterface();
        originalValues.recurrence = {
            weekly: new Set(recurrenceData.weekDays),
            monthly: new Set(recurrenceData.monthDays),
            yearly: new Set(recurrenceData.yearDays),
            endDate: recurrenceData.endDate ? new Date(recurrenceData.endDate).toISOString().split('T')[0] : ''
        }
    }

    initializeValidation(originalValues, presetDataEl.dataset.isNew === 'true');

    updateHiddenFields();
    initializeModal();

    // Event listeners
    presetForm.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', () => checkIfModified(submitButton));
        field.addEventListener('change', () => checkIfModified(submitButton));
    });

    document.getElementById('clearStartHour').addEventListener('click', () => {
        document.getElementById('startHour').value = '';
        checkIfModified(submitButton);
    });

    returnLink.addEventListener('click', (event) => {
        if (!submitButton.disabled && presetDataEl.dataset.isNew !== 'true') {
            event.preventDefault();
            if (confirm('Des modifications non sauvegardées ont été détectées. Voulez-vous vraiment quitter la page ? Les modifications seront perdues.')) {
                window.location.href = returnLink.href;
            }
        }
    });
});

function initializeRecurrenceInterface() {
    document.querySelectorAll('#weekly-section .pattern-item').forEach(item => {
        const day = parseInt(item.dataset.day);
        if (recurrenceData.weekDays.includes(day)) {
            item.classList.add('selected');
        }
    });

    document.querySelectorAll('#monthly-section .pattern-item').forEach(item => {
        const day = parseInt(item.dataset.day);
        if (recurrenceData.monthDays.includes(day)) {
            item.classList.add('selected');
        }
    });

    if (recurrenceData.yearDays?.length > 0) {
        updateYearlyDatesList();
    }

    // Initialisation de la date de fin de récurrence
    const dateUntilInput = document.getElementById('dateUntilRecurrence');
    if (recurrenceData.endDate) {
        // Formatage de la date au format YYYY-MM-DD pour l'input date
        const date = new Date(recurrenceData.endDate);
        const formattedDate = date.toISOString().split('T')[0];
        dateUntilInput.value = formattedDate;
    }
    
    updateRecurrenceSummary();
    updateHiddenFields();
}
