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

function updateRecurrenceData(type, day, isAdded) {
    if (!isAdded) {
        for (let k of Object.keys(recurrenceData)) {
            if (k !== type && recurrenceData[k].size > 0) {
                afficherPopUp(`Récurrence ${k === 'yearly' ? "à l'année" : k === 'monthly' ? "au mois" : 'à la semaine'} déjà défini`, false)
                return 0;
            }
        }
        recurrenceData[type].add(day);
    } else {
        recurrenceData[type].delete(day);
    }
    return 1;
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
function afficherPopUp(text, good) {
    const popUp = document.querySelector(".pop-up-info")
    popUp.innerHTML = ''
    popUp.innerHTML = good ? `
                <svg viewBox="0 0 512 512">
                    <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#4bc373" stroke="none">
                    <path d="M2361 5110 c-442 -37 -865 -184 -1222 -426 -164 -110 -242 -175 -394 -328 -240 -242 -414 -499 -539 -799 -240 -571 -267 -1198 -79 -1781 277 -859 995 -1514 1873 -1710 364 -81 753 -81 1120 0 676 149 1277 586 1639 1192 329 551 436 1227 295 1862 -167 751 -675 1395 -1368 1735 -246 120 -524 205 -786 239 -148 19 -406 27 -539 16z m1552 -1290 c179 -67 298 -268 269 -452 -5 -37 -24 -98 -41 -136 -30 -63 -82 -117 -944 -978 -1000 -998 -946 -950 -1095 -976 -54 -9 -85 -9 -134 0 -134 25 -148 36 -575 464 -426 427 -431 433 -455 568 -13 77 0 167 36 245 29 64 110 154 170 189 135 79 326 73 450 -14 23 -16 131 -119 241 -229 l200 -201 735 734 c449 448 753 744 780 759 106 61 247 71 363 27z"/>
                    <path d="M3675 3737 c-22 -8 -56 -22 -75 -31 -19 -10 -379 -362 -800 -782 l-765 -764 -240 241 c-286 287 -297 294 -435 294 -83 0 -101 -3 -145 -27 -62 -32 -130 -104 -158 -166 -16 -35 -21 -67 -21 -127 0 -137 -2 -135 441 -576 435 -433 423 -424 563 -424 147 0 84 -55 1092 953 1008 1008 952 944 952 1092 0 177 -127 314 -302 326 -41 2 -83 -1 -107 -9z"/>
                    </g>
                </svg>
            ` :
            `
                <svg viewBox="0 0 48 48">
                    <g transform="matrix(.99999 0 0 .99999-58.37.882)" enable-background="new" id="g13" style="fill-opacity:1">
                        <circle cx="82.37" cy="23.12" r="24" fill="url(#0)" id="circle9" style="fill-opacity:1;fill:#dd3333"/>
                        <path d="m87.77 23.725l5.939-5.939c.377-.372.566-.835.566-1.373 0-.54-.189-.997-.566-1.374l-2.747-2.747c-.377-.372-.835-.564-1.373-.564-.539 0-.997.186-1.374.564l-5.939 5.939-5.939-5.939c-.377-.372-.835-.564-1.374-.564-.539 0-.997.186-1.374.564l-2.748 2.747c-.377.378-.566.835-.566 1.374 0 .54.188.997.566 1.373l5.939 5.939-5.939 5.94c-.377.372-.566.835-.566 1.373 0 .54.188.997.566 1.373l2.748 2.747c.377.378.835.564 1.374.564.539 0 .997-.186 1.374-.564l5.939-5.939 5.94 5.939c.377.378.835.564 1.374.564.539 0 .997-.186 1.373-.564l2.747-2.747c.377-.372.566-.835.566-1.373 0-.54-.188-.997-.566-1.373l-5.939-5.94" fill="#fff" fill-opacity=".842" id="path11" style="fill-opacity:1;fill:#ffffff"/>
                    </g>
                </svg>
            `;
    const span1 = document.createElement("span")
    span1.innerText = text
    popUp.appendChild(span1)
    popUp.classList.add('display-pop-up');
    setTimeout(() => {
        popUp.classList.remove('display-pop-up');
    }, 5000)
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
