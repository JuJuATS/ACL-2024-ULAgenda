import { checkIfModified } from './form-validation.js';

// État privé du module
let submitButton = null;
let recurrenceData = {
    weekly: new Set(),
    monthly: new Set(),
    yearly: new Set()
};
let recurrenceBackup = null;

// Fonctions de gestion de l'état
function initializeRecurrenceHandlers(button) {
    submitButton = button;
}

function initializeRecurrenceData(data) {
    recurrenceData = {
        weekly: new Set(data.weekDays || []),
        monthly: new Set(data.monthDays || []),
        yearly: new Set(data.yearDays || [])
    };
}

function getRecurrenceData() {
    return recurrenceData;
}

function updateRecurrenceData(type, day, isAdding) {
    if (isAdding) {
        recurrenceData[type].add(day);
    } else {
        recurrenceData[type].delete(day);
    }
}

function createBackup() {
    recurrenceBackup = {
        weekly: new Set(Array.from(recurrenceData.weekly)),
        monthly: new Set(Array.from(recurrenceData.monthly)),
        yearly: new Set(Array.from(recurrenceData.yearly))
    };
}

function restoreBackup() {
    if (recurrenceBackup) {
        recurrenceData = {
            weekly: new Set(Array.from(recurrenceBackup.weekly)),
            monthly: new Set(Array.from(recurrenceBackup.monthly)),
            yearly: new Set(Array.from(recurrenceBackup.yearly))
        };

        // Restaurer l'interface visuelle
        document.querySelectorAll('.pattern-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Restaurer les sélections hebdomadaires
        if (recurrenceData.weekly.size > 0) {
            recurrenceData.weekly.forEach(day => {
                const element = document.querySelector(`#weekly-section .pattern-item[data-day="${day}"]`);
                if (element) element.classList.add('selected');
            });
        }

        // Restaurer les sélections mensuelles
        if (recurrenceData.monthly.size > 0) {
            recurrenceData.monthly.forEach(day => {
                const element = document.querySelector(`#monthly-section .pattern-item[data-day="${day}"]`);
                if (element) element.classList.add('selected');
            });
        }

        updateYearlyDatesList();
        updateRecurrenceSummary();
        updateHiddenFields();
    }
}

function updateHiddenFields() {
    document.getElementById('weekDays').value = JSON.stringify(Array.from(recurrenceData.weekly));
    document.getElementById('monthDays').value = JSON.stringify(Array.from(recurrenceData.monthly));
    document.getElementById('yearDays').value = JSON.stringify(Array.from(recurrenceData.yearly));
    if (submitButton) {
        checkIfModified(submitButton);
    }
}

function updateYearlyDatesList() {
    const datesList = document.getElementById('year-dates');
    datesList.innerHTML = '';
    
    recurrenceData.yearly.forEach(date => {
        const li = document.createElement('li');
        li.className = 'date-item';
        const formattedDate = new Date(date).toLocaleDateString();
        
        // Créer le span pour la date
        const span = document.createElement('span');
        span.textContent = formattedDate;
        
        // Créer le bouton de suppression
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', 'Supprimer cette date');
        
        // Ajouter l'écouteur d'événement directement sur le bouton
        button.addEventListener('click', () => {
            recurrenceData.yearly.delete(date);
            updateYearlyDatesList();
            updateHiddenFields();
        });
        
        // Assembler les éléments
        li.appendChild(span);
        li.appendChild(button);
        datesList.appendChild(li);
    });
}

function updateRecurrenceSummary() {
    const indicator = document.getElementById('recurrence-indicator');
    const summary = document.getElementById('recurrence-summary');
    let text = [];

    if (recurrenceData.weekly.size) {
        text.push(`${recurrenceData.weekly.size} jour${recurrenceData.weekly.size > 1 ? 's' : ''}/semaine`);
    }
    if (recurrenceData.monthly.size) {
        text.push(`${recurrenceData.monthly.size} jour${recurrenceData.monthly.size > 1 ? 's' : ''}/mois`);
    }
    if (recurrenceData.yearly.size) {
        text.push(`${recurrenceData.yearly.size} date${recurrenceData.yearly.size > 1 ? 's' : ''}/an`);
    }

    if (text.length) {
        summary.textContent = text.join(', ');
        indicator.classList.remove('hide');
    } else {
        summary.textContent = 'Aucune récurrence définie';
        indicator.classList.add('hide');
    }
}

export {
    initializeRecurrenceHandlers,
    initializeRecurrenceData,
    getRecurrenceData,
    updateRecurrenceData,
    updateHiddenFields,
    updateYearlyDatesList,
    updateRecurrenceSummary,
    createBackup,
    restoreBackup,
};