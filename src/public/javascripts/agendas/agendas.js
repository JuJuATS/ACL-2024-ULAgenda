function redirectToAgenda(agendaId) {
    window.location.href = `/rendezvous?agendaId=${agendaId}`;
}

function stopEventPropagation(event) {
    event.stopPropagation();
}

async function toggleEditMode(button, event) {
    event.stopPropagation();

    const calendar = button.closest('.calendar');
    const titleView = calendar.querySelector('.title-view');
    const editTitle = calendar.querySelector('.edit-title');
    const input = editTitle.querySelector('input');

    if (editTitle.style.display === 'none' || !editTitle.style.display) {
        // Mode édition
        titleView.style.display = 'none';
        editTitle.style.display = 'flex';
        button.textContent = 'Sauvegarder';
        input.focus();
    } else {
        // Sauvegarde
        const newTitle = input.value;
        const agendaId = calendar.getAttribute('data-id');

        try {
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
                titleView.textContent = newTitle;
                titleView.style.display = 'block';
                editTitle.style.display = 'none';
                button.textContent = 'Modifier';
            } else {
                alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
        }
    }
}

// Éléments de la modal et du bouton
const modal = document.getElementById("agendaModal");
const addButton = document.querySelector(".add-button");
const closeButton = document.querySelector(".close-button");
const addAgendaButton = document.getElementById("addAgendaButton");
const agendaNameInput = document.getElementById("agendaName");
const mainContent = document.querySelector(".main-content"); // Conteneur des agendas

// Ouvrir la modal quand le bouton "+" est cliqué
addButton.onclick = function() {
    modal.style.display = "block";
}

// Fermer la modal quand l'utilisateur clique sur le "x"
closeButton.onclick = function() {
    modal.style.display = "none";
}

// Fermer la modal quand l'utilisateur clique à l'extérieur de la modal
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

// Fonction pour ajouter l'agenda à la liste
addAgendaButton.onclick = async () => {
    const agendaName = agendaNameInput.value;

    if (!agendaName) {
        alert("Veuillez entrer un nom d'agenda.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/agendas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name: agendaName })
        });

        if (response.ok) {
            const newAgenda = await response.json();

            // Créer un nouvel élément agenda avec la nouvelle structure
            const agendaDiv = document.createElement("div");
            agendaDiv.className = "calendar";
            agendaDiv.setAttribute("data-id", newAgenda._id);
            agendaDiv.onclick = () => redirectToAgenda(newAgenda._id);
            
            agendaDiv.innerHTML = `
                <div class="header-calendar">
                    <div class="header-actions">
                        <button class="edit-button" onclick="toggleEditMode(this, event)">Modifier</button>
                        <div class="dropdown">
                            <button class="options-button" onclick="toggleDropdown(event, this)">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-content">
                                <a href="/agendas/${newAgenda._id}/share" onclick="event.stopPropagation()">
                                    <i class="fas fa-share-alt"></i> Partager
                                </a>
                                <a href="#" onclick="removeAgenda(this, event)" data-agenda-id="${newAgenda._id}">
                                    <i class="fas fa-trash"></i> Supprimer
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content-calendar">
                    <a class="title-view">${newAgenda.name}</a>
                    <span class="edit-title" style="display: none;" onclick="stopEventPropagation(event)">
                        <input type="text" value="${newAgenda.name}" />
                    </span>
                </div>
            `;

            // Insérer le nouvel agenda après le bouton "Nouvel Agenda"
            const newAgendaButton = document.getElementById('new-agenda');
            newAgendaButton.parentNode.insertBefore(agendaDiv, newAgendaButton.nextSibling);

            // Réinitialiser l'input et fermer la modal
            agendaNameInput.value = "";
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

let agendaToDelete = null; // Variable pour stocker l'agenda à supprimer


function removeAgenda(link, event) {
    event.preventDefault();
    event.stopPropagation();
    
    const agendaId = link.getAttribute('data-agenda-id');
    const calendar = document.querySelector(`.calendar[data-id="${agendaId}"]`);
    
    // Affiche la modal de confirmation
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    confirmDeleteModal.style.display = 'block';
    
    // Configure le bouton de confirmation
    document.getElementById('confirmDeleteButton').onclick = async function() {
        try {
            const response = await fetch(`/agendas/${agendaId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                calendar.remove();
                closeConfirmDeleteModal();
            } else {
                const data = await response.json();
                alert(data.message || 'Une erreur est survenue');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue lors de la suppression');
        }
    };
}

// Fonction pour fermer la modal de confirmation
function closeConfirmDeleteModal() {
    const confirmDeleteModal = document.getElementById("confirmDeleteModal");
    confirmDeleteModal.style.display = "none"; // Masquer la modal de confirmation
}

function toggleDropdown(event, button) {
    event.stopPropagation();
    const dropdown = button.parentElement;
    
    // Ferme tous les autres dropdowns
    document.querySelectorAll('.dropdown.active').forEach(d => {
        if (d !== dropdown) d.classList.remove('active');
    });
    
    dropdown.classList.toggle('active');
}

// Ferme les dropdowns quand on clique ailleurs sur la page
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.active').forEach(d => {
            d.classList.remove('active');
        });
    }
});

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
