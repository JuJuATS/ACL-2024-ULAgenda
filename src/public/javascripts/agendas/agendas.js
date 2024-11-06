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

            // Créer un nouvel élément agenda
            const agendaDiv = document.createElement("div");
            agendaDiv.className = "calendar"; // Assurez-vous que le style est appliqué
            agendaDiv.setAttribute("data-id", newAgenda._id);
            agendaDiv.innerHTML = `
                <div class="header-calendar">
                    <button class="edit-button" onclick="toggleEditMode(this, event)">Modifier</button>
                    <button class="close-agenda" onclick="removeAgenda(this, event)">x</button>
                </div>
                <div class="content-calendar">
                    <a class="title-view">${newAgenda.name}</a>
                    <span class="edit-title" style="display: none;">
                        <input type="text" value="${newAgenda.name}" />
                    </span>
                </div>
            `;

            // Ajouter le nouvel agenda au conteneur principal
            mainContent.appendChild(agendaDiv);

            // Réinitialise l'input
            agendaNameInput.value = "";

            // Fermer la modal
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

function removeAgenda(button, event) {
    event.stopPropagation();
    event.preventDefault();
    agendaToDelete = button.closest('.calendar');

    const confirmDeleteModal = document.getElementById("confirmDeleteModal");
    confirmDeleteModal.style.display = "block";
}

// Fonction pour fermer la modal de confirmation
function closeConfirmDeleteModal() {
    const confirmDeleteModal = document.getElementById("confirmDeleteModal");
    confirmDeleteModal.style.display = "none"; // Masquer la modal de confirmation
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