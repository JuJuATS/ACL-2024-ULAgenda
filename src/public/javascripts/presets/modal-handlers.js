import {
    updateHiddenFields,
    updateYearlyDatesList,
    updateRecurrenceSummary,
    restoreBackup,
    createBackup,
    updateRecurrenceData
} from './recurrence-handlers.js';

function initializeModal() {
    const modal = document.getElementById('recurrence-modal');
    const recurrenceButton = document.getElementById('recurrence-button');
    const cancelButton = modal.querySelector('.btn-cancel');
    const saveButton = modal.querySelector('.btn-save');
    const typeButtons = document.querySelectorAll('.recurrence-type');
    const sections = {
        weekly: document.getElementById('weekly-section'),
        monthly: document.getElementById('monthly-section'),
        yearly: document.getElementById('yearly-section')
    };

    recurrenceButton.addEventListener('click', () => {
        createBackup();
        modal.style.display = 'flex';
    });

    cancelButton.addEventListener('click', () => {
        restoreBackup();
        modal.style.display = 'none';
    });

    saveButton.addEventListener('click', () => {
        updateRecurrenceSummary();
        modal.style.display = 'none';
        updateHiddenFields();
    });

    typeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            typeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            Object.entries(sections).forEach(([key, section]) => {
                section.classList.toggle('hide', key !== type);
            });
        });
    });

    document.querySelectorAll('.pattern-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = document.querySelector('.recurrence-type.active').dataset.type;
            const day = parseInt(item.dataset.day);

            if (updateRecurrenceData(type, day, item.classList.contains('selected'))) {
                item.classList.toggle('selected');
            }
            updateHiddenFields();
        });
    });

    const yearlyDateInput = document.getElementById('yearly-date-input');
    const addYearlyDateButton = document.getElementById('add-yearly-date');

    addYearlyDateButton.addEventListener('click', () => {
        const date = yearlyDateInput.value;
        if (date) {
            updateRecurrenceData('yearly', date, false);
            updateYearlyDatesList();
            yearlyDateInput.value = '';
            updateHiddenFields();
        }
    });
}

export { initializeModal };
