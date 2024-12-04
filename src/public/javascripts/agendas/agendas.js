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

// Éléments de la page
const createModal = document.getElementById("createNewAgendaModal");
const addButton = document.querySelector(".add-button");
const closeButton = document.querySelector(".close-button");
const agendaNameInput = document.getElementById("agendaName");
const addAgendaButton = document.getElementById("addAgendaButton");
const mainContent = document.querySelector(".main-content");

document.addEventListener("DOMContentLoaded", function() {
    // Appel à l'endpoint pour récupérer les agendas
    fetch("/agendas/getAgendas")
        .then(response => response.text())
        .then(text => {
            try {
                const { ownedAgendas, sharedAgendas } = JSON.parse(text); // Récupère les deux listes

                // Création des agendas personnels ici :
                const personalContainer = document.querySelector('.calendars-grid.personal');
                ownedAgendas.forEach(agenda => {
                    const agendaDivHTML = generateAgendaHTML(agenda);
                    const agendaDiv = generateAgendaDiv(agendaDivHTML, agenda);
                    personalContainer.appendChild(agendaDiv);
                    updateAgendaCounts();
                });

                // Création des agendas partagés ici :
                const sharedContainer = document.querySelector('.calendars-grid.shared');
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
});

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

addButton.onclick = function() {
    createModal.style.display = "block";
}

function closeModal(modal) {
    modal.style.display = "none";
}

/* ====================================================================== 
                            CREATION DES AGENDAS
   ====================================================================== */

function generateAgendaHTML(agenda) {
    return `
        <div class="layer1" onclick="redirectToAgenda('${agenda._id}')">
             <div class="title-section">
                <h1 id="agendaName">${agenda.name}</h1>
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


/* ====================================================================== 
                                REDIRECTIONS
   ====================================================================== */

function redirectToAgenda(agendaId) {
    window.location.href = `/planning`;
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



