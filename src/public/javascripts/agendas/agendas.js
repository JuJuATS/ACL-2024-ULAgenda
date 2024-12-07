// Fonction pour mettre à jour les compteurs
function updateAgendaCounts() {
    // Compter les agendas personnels
    const ownedAgendas = document.querySelectorAll('.calendar[data-id]').length - document.querySelectorAll('.shared-calendar[data-id]').length;
    const ownedCountBadge = document.querySelector('.agenda-section:first-child .count-badge');

    if (ownedCountBadge) {
        ownedCountBadge.innerHTML = ownedAgendas;
    }

    // Compter les agendas partagés
    const sharedAgendas = document.querySelectorAll('.shared-calendar[data-id]').length;

    // Changer le sélecteur pour cibler spécifiquement la section des agendas partagés
    const sharedSection = document.querySelector('.agenda-section:nth-child(2)');
    const sharedCountBadge = sharedSection?.querySelector('.count-badge');

    if (sharedCountBadge) {
        sharedCountBadge.innerHTML = sharedAgendas;
    }

    // Gérer l'affichage de la section des agendas partagés séparément
    if (sharedSection) {
        sharedSection.style.display = (sharedAgendas === 0) ? 'none' : 'block';
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

// Éléments de la page
const createModal = document.getElementById("createNewAgendaModal");
let addButton = document.querySelector(".add-button");
const closeButton = document.querySelector(".close-button");
const agendaNameInput = document.getElementById("agendaName");
const addAgendaButton = document.getElementById("addAgendaButton");
const mainContent = document.querySelector(".main-content");
let exportMode = false;
let exportedAgenda = [] // id

document.addEventListener("DOMContentLoaded", initAgendas);

function initAgendas() {
    // Appel à l'endpoint pour récupérer les agendas
    fetch("/agendas/getAgendas")
        .then(response => response.text())
        .then(text => {
            try {
                const { ownedAgendas, sharedAgendas } = JSON.parse(text); // Récupère les deux listes

                // Création des agendas personnels ici :
                const personalContainer = document.querySelector('.calendars-grid.personal');
                personalContainer.innerHTML = `<div class="calendar newAgenda">
                        <div class="addCalendarBody">
                            <button class="add-button" style="height:75px; width:75px;">+</button>
                        </div>
                    </div>`

                addButton = document.querySelector(".add-button");
                addButton.addEventListener("click",(e)=> {

                    createModal.style.display = "block";
                })
                ownedAgendas.forEach(agenda => {
                    const agendaDivHTML = generateAgendaHTML(agenda);
                    const agendaDiv = generateAgendaDiv(agendaDivHTML, agenda);
                    personalContainer.appendChild(agendaDiv);
                    updateAgendaCounts();
                });

                // Création des agendas partagés ici :
                const sharedContainer = document.querySelector('.calendars-grid.shared');
                sharedContainer.innerHTML = ''

                sharedAgendas.forEach(agenda => {
                    const agendaDivHTML = generateAgendaHTML(agenda);
                    const agendaDiv = generateAgendaDiv(agendaDivHTML, agenda, true); // Passe un flag pour "partagé"
                    setupSharedAgenda(agendaDiv, agenda);
                    sharedContainer.appendChild(agendaDiv);
                    updateAgendaCounts();
                });

            } catch (error) {
                console.error('Erreur lors de la conversion de la réponse en JSON:', error);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des agendas:', error);
        });
}

function openCloseOptions(container) {
    const tab = container.getElementsByClassName('tab')[0];
    const layer2 = container.getElementsByClassName('layer2')[0];
    let openTimeout, closeTimeout;

    // Fonction pour ouvrir le container
    function openContainer() {
        clearTimeout(closeTimeout);
        openTimeout = setTimeout(() => {
            container.classList.add('open'); // Ajoute la classe 'open' pour afficher le conteneur
        }, 100);
    }

    // Fonction pour fermer le container
    function closeContainer(event) {
        if (!container.contains(event.relatedTarget)) {
            clearTimeout(openTimeout);
            closeTimeout = setTimeout(() => {
                container.classList.remove('open'); // Retire la classe 'open' pour masquer le conteneur
            }, 100);
        }
    }

    // Si l'élément 'tab' existe, écoutez le clic dessus
    if (tab) {
        tab.addEventListener('click', () => {
            if (container.classList.contains('open')) {
                // Si le conteneur est déjà ouvert, le fermer
                closeContainer({ relatedTarget: null });
            } else {
                // Sinon, ouvrir le conteneur
                openContainer();
            }
        });
    } else {
        console.log("Aucun élément avec la classe 'tab' trouvé.");
    }

    // Si l'élément 'layer2' existe, écoutez le mouseleave pour fermer le conteneur
    if (layer2) {
        layer2.addEventListener('mouseleave', closeContainer);
    } else {
        console.log("Aucun élément avec la classe 'layer2' trouvé.");
    }
}


/* ======================================================================
                                MODALS
   ====================================================================== */



function closeModal(modal) {
    modal.style.display = "none";
}

/* ======================================================================
                            CREATION DES AGENDAS
   ====================================================================== */

function generateAgendaHTML(agenda) {
    return `
        <div class="layer1" onclick="redirectToAgenda(this, '${agenda._id}')">
             <div class="title-section">
                <h3 id="agendaName">${agenda.name}</h1>
            </div>
        </div>
        <div class="tab">+</div>
        <div class="layer2">
            

            <div id="layer2-content">
    <div class="top-row">
        <a class="agenda-but share-but" href="/agendas/${agenda._id}/share"> Partager</a>
        <button class="agenda-but rdv-but" onclick="redirectToRendezVous('${agenda._id}')">Rendezvous</button>
    </div>
    <div class="bottom-row">
        <button class="agenda-but modify-but" onclick="renameAgenda(this, event) ">Renommer</button>
        <button class="agenda-but delete-but" onclick="removeAgenda(this, event)">Supprimer</button>
    </div>
</div>

            
        </div>
    `;
}

function generateAgendaDiv(agendaHTML, agenda, isShared = false) {
    const agendaDiv = document.createElement('div');
    agendaDiv.className = `calendar ${isShared ? 'shared-calendar' : ''}`;
    agendaDiv.dataset.id = agenda._id;
    agendaDiv.innerHTML = agendaHTML;

    if (isShared) {
        const badge = document.createElement('span');
        badge.className = `access-level-badge ${agenda.accessLevel}`;
        badge.textContent = agenda.accessLevel;

        const agendaName = document.createElement('span');
        agendaName.className = 'agenda-name';
        agendaName.textContent = agenda.name;

        const badgeContainer = document.createElement('div');
        badgeContainer.className = 'badge-container';
        badgeContainer.append(badge, agendaName);

        agendaDiv.prepend(badgeContainer); // Place le container en haut de l'agenda
    }

    openCloseOptions(agendaDiv);

    return agendaDiv;
}


function setupSharedAgenda(agendaDiv, agenda) {
    const layer1 = agendaDiv.getElementsByClassName('layer1')[0];

    // Vérifie si des informations de partage existent
    const calendarInfoDiv = document.createElement('div');
    calendarInfoDiv.classList.add('calendar-info');

    if (agenda.sharedBy) {
        const sharedByDiv = document.createElement('div');
        sharedByDiv.classList.add('shared-by');
        sharedByDiv.innerHTML = `
            <small>
                Partagé par : ${agenda.sharedBy.pseudo}
            </small>
        `;
        calendarInfoDiv.appendChild(sharedByDiv);
    }

    if (agenda.settings && (agenda.settings.validFrom || agenda.settings.validUntil)) {
        const shareValidityDiv = document.createElement('div');
        shareValidityDiv.classList.add('share-validity');
        let validityText = '<small>';

        if (agenda.settings.validFrom) {
            validityText += `À partir du ${new Date(agenda.settings.validFrom).toLocaleDateString()}`;
        }

        if (agenda.settings.validUntil) {
            validityText += `${agenda.settings.validFrom ? ' - ' : ''}Jusqu'au ${new Date(agenda.settings.validUntil).toLocaleDateString()}`;
        }

        validityText += '</small>';
        shareValidityDiv.innerHTML = validityText;
        calendarInfoDiv.appendChild(shareValidityDiv);
    }

    // Modifie la classe layer1 par layer-shared
    layer1.className = 'layer1-shared';

    // Ajoute les informations à la div de l'agenda existant
    layer1.appendChild(calendarInfoDiv);
}

// Fonction pour ajouter l'agenda à la liste
addAgendaButton.onclick = async () => {
    const agendaName = agendaNameInput.value;

    if (!agendaName) {
        alert("Veuillez entrer un nom d'agenda.");
        return;
    }

    try {
        const response = await fetch('/agendas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name: agendaName })
        });

        if (response.ok) {
            const newAgenda = await response.json();

            const personalContainer = document.querySelector('.calendars-grid.personal');
            const agendaDivHTML = generateAgendaHTML(newAgenda);
            const agendaDiv = generateAgendaDiv(agendaDivHTML, newAgenda);
            personalContainer.appendChild(agendaDiv);
            updateAgendaCounts();

            closeModal(createModal);
        } else {
            const errorData = await response.json();
            alert(errorData.message + ' : ' + JSON.stringify(errorData.error));
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur s\'est produite lors de la création de l\'agenda');
    }
};

/* ======================================================================
                            SUPPRESSION DES AGENDAS
   ====================================================================== */

let agendaToDelete = null;

const confirmDeleteModal = document.getElementById("confirmDeleteModal");

function removeAgenda(button, event) {
    event.preventDefault();

    agendaToDelete = button.closest('.calendar');
    confirmDeleteModal.style.display = "block";
}

const confirmDeleteButton = document.getElementById("confirmDeleteButton");

// Événement de confirmation pour supprimer l'agenda
confirmDeleteButton.onclick = async function() {
    if (agendaToDelete) {
        const agendaId = agendaToDelete.getAttribute('data-id');

        try {
            const response = await fetch(`http://localhost:3000/agendas/${agendaId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                agendaToDelete.remove();
                closeModal(confirmDeleteModal);
                agendaToDelete = null;
            } else {
                const errorData = await response.json();
                alert('Erreur lors de la suppression de l\'agenda: ' + errorData.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur s\'est produite lors de la suppression de l\'agenda');
        }
    } else {
        console.error("agendaToDelete is nill");
    }
}

/* ======================================================================
                            RENOMMAGE DES AGENDAS
   ====================================================================== */

let agendaToRename = null;

const confirmRenameModal = document.getElementById("confirmRenameModal");
const confirmRenameButton = document.getElementById("confirmRenameButton");
const inputAgendaName = document.getElementById("inputAgendaName");

function renameAgenda(button, event) {
    event.preventDefault();

    agendaToRename = button.closest('.calendar');
    confirmRenameModal.style.display = "block";
}

// Événement de confirmation pour renommer l'agenda.
confirmRenameButton.onclick = async function() {
    if (agendaToRename) {
        try {
            const agendaId = agendaToRename.getAttribute("data-id");
            const newTitle = inputAgendaName.value;
            const agendaNameTitle = agendaToRename.querySelector("#agendaName");

            if (!agendaId) {
                alert("Impossible de retrieve l'agendaId");
            }

            const response = await fetch(`http://localhost:3000/agendas/updateAgendaTitle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ agendaId, newTitle })
            });

            const responseText = await response.text();
            console.log('Response Text:', responseText);

            const data = JSON.parse(responseText);

            if (data.success) {
                agendaNameTitle.textContent = newTitle;
                inputAgendaName.value = "";
                closeModal(confirmRenameModal);
            } else {

                alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
            }

        } catch (error) {  
            console.error('Error:', error);
            alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
        }
    }
}
const exitExportMode = () => {

    exportMode = false;
    exportedAgenda = [];
    document.querySelector(".export-button").style.background = 'linear-gradient(135deg, #445a77, #2b3d56)'
    document.querySelector(".export-button-stop").classList.add('closed')


    document.querySelectorAll('.calendar').forEach(e => {
        e.classList.toggle('export-mode-calendar');
        e.classList.remove('hover')
    });
}

async function exportAgenda() {
    if (exportedAgenda.length > 0) {
        const res = await fetch('agendas/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: exportedAgenda })
        });
        const data = (await res.json())
        if (data.success && data !== {}) {
            try {
                if (window.showSaveFilePicker) {        // new browser
                    const handle = await window.showSaveFilePicker({
                        suggestedName: `agendas${Date.now()}.json`,
                        types: [{
                            description: 'JSON file',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });

                    const writable = await handle.createWritable();
                    await writable.write(data.content);
                    await writable.close();
                } else {        // older browser
                    const blob = new Blob([data.content], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `agendas${Date.now()}.json`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                }

            } catch (err) {
                console.error('Error saving file:', err);
                afficherPopUp("Erreur lors de l'exportation des agendas.", false)
            }
        } else {
            afficherPopUp("Erreur lors de l'exportation des agendas.", false)
        }
    } else {
        afficherPopUp("Aucun agendas n'a était sélectionné.", false)
    }



}

async function importAgenda() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
        const file = event.target.files[0];

        // Read as text
        const text = await file.text();

        try {
            JSON.parse(text);
        } catch (e) {
            afficherPopUp("Mauvais format du fichier .json", false)
            return false;
        }
        const res = await fetch('agendas/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: text
        });
        const value = await res.json()
        if (value.error) {
            afficherPopUp(value.error, false)
        }
        if (value.success) {
            initAgendas()
        } else {
            afficherPopUp("Agendas importés à l'exception de :\n" + Object.entries(value.errorsAgenda).map(a => `${a[0]} - ${a[1]} non définie`).join('\n'), true)
            initAgendas()
        }
    };
    input.click();
}

document.querySelector(".export-button").addEventListener("click", async (e) => {
    if (!exportMode) {
        exportMode = true;
        document.querySelector(".export-button").style.background = 'linear-gradient(135deg, #523fc0, #031c3e)'
        document.querySelector(".export-button-stop").classList.remove('closed')

        document.querySelectorAll('.calendar').forEach(e => {
            e.classList.toggle('export-mode-calendar');
        });
    } else {
        await exportAgenda()
        exitExportMode()
    }
});

document.querySelector(".export-button-stop").addEventListener("click", exitExportMode);

document.querySelector(".import-button").addEventListener("click", async (e) => {
    await importAgenda()
});
/* ======================================================================
                                REDIRECTIONS
   ====================================================================== */

function redirectToAgenda(e, agendaId) {
    if (exportMode) {
        if (exportedAgenda.includes(agendaId)) {
            const index = exportedAgenda.indexOf(agendaId);
            if (index > -1) {
                exportedAgenda.splice(index, 1);
            }
        } else {
            exportedAgenda.push(agendaId);
        }
        e.parentElement.classList.toggle("hover")
    }
    else window.location.href = `/planning`
}

function redirectToRendezVous(agendaId) {
    window.location.href = `/rendezvous?agendaId=${agendaId}`;
}

function stopEventPropagation(event) {
    event.stopPropagation();
}
// Fermeture des modals
function closeModal(modal) {
    modal.style.display = "none";
    //modal.querySelector(".modal-content").style.transform = "scale(0)";
}

// Affichage des modals
function openModal(modalId) {
    let modal = document.getElementById(modalId);
    modal.style.display = "flex";
    modal.querySelector(".modal-content").style.transform = "scale(1)";
}

document.querySelectorAll('.calendar').forEach(openCloseOptions);



