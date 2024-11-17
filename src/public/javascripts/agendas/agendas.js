// Éléments de la modal et du bouton
const modal = document.getElementById("agendaModal");
const addButton = document.querySelector(".add-button");
const closeButton = document.querySelector(".close-button");
const agendaNameInput = document.getElementById("agendaName");
const addAgendaButton = document.getElementById("addAgendaButton");
const mainContent = document.querySelector(".main-content");

document.addEventListener("DOMContentLoaded", function() {
    fetch("/agendas/getAgendas")
        .then(response => response.text())
        .then(text => {
            try {
                const agendas = JSON.parse(text);
                agendas.forEach(agenda => {
                    const agendaDiv = generateAgendaDiv(
                        generateAgendaHTML(agenda), agenda
                    );
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

    function openContainer() {
        clearTimeout(closeTimeout);
        openTimeout = setTimeout(() => {
            container.classList.add('open');
        }, 300);
    }

    function closeContainer(event) {
        if (!container.contains(event.relatedTarget)) {
            clearTimeout(openTimeout);
            closeTimeout = setTimeout(() => {
                container.classList.remove('open');
            }, 300);
        }
    }

    if (tab) {
        tab.addEventListener('mouseenter', openContainer);
    } else {
        console.log("Aucun élément avec la classe 'tab' trouvé.");
    }

    if (layer2) {
        layer2.addEventListener('mouseleave', closeContainer);
    } else {
        console.log("Aucun élément avec la classe 'layer2' trouvé.");
    }
}

/* ====================================================================== 
                                    MODAL
   ====================================================================== */

addButton.onclick = function() {
    modal.style.display = "block";
}

closeButton.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
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
            <h1 id="agendaName">${agenda.name}</h1>
        </div>

        <div class="layer2">
            <div class="tab">Ｏ Ｏ Ｏ</div>

            <div id="layer2-content">
                <button class="agenda-but share-but">Partager</button>
                <button class="agenda-but rdv-but" onclick="redirectToRendezVous('${agenda._id}')">Nouveau Rendez-vous</button>
                <button class="agenda-but modify-but" onclick="renameAgenda(this, event)">Renommer</button>
                <button class="agenda-but delete-but" onclick="removeAgenda(this, event)">Supprimer</button>
            </div>
            
        </div>

    `;
}

function generateAgendaDiv(htmlCode, agenda) {
    const agendaDiv = document.createElement('div');
    agendaDiv.className = "calendar";
    agendaDiv.setAttribute('data-id', agenda._id);
    agendaDiv.innerHTML = htmlCode;

    openCloseOptions(agendaDiv);

    mainContent.appendChild(agendaDiv);

    return agendaDiv;
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

            const agendaDiv = generateAgendaDiv(
                generateAgendaHTML(newAgenda), newAgenda
            );

            modal.style.display = "none";
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
    event.stopPropagation();
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
                closeConfirmDeleteModal();
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
    event.stopPropagation();
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

/* ====================================================================== 
                                MODE SOMBRE
   ====================================================================== */

/*

// Bascule du mode sombre
const toggleSwitch = document.getElementById('darkModeToggle');
const body = document.body;

// Vérifie si l'utilisateur a déjà un mode préféré
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        toggleSwitch.checked = true;
    }
}

// Gère la bascule
toggleSwitch.addEventListener('change', () => {
    if (toggleSwitch.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
});

*/