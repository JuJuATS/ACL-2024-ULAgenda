const form = document.getElementById('rendezvous-form');
const agendaList = document.getElementById('agenda-list');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    const nom = document.getElementById('nom').value;
    const date = document.getElementById('date').value;
    const heureDebut = document.getElementById('heureDebut').value;
    const duree = parseFloat(document.getElementById('duree').value); // Lire la durée en heures
    const description = document.getElementById('description').value;
    const rappel = document.getElementById('rappel').value;
    if (!(!nom || !date || !heureDebut || !duree || !description)) {
      
        const dateString = `${date}T${heureDebut}:00`; // ajoute les secondes, format ISO 8601
        const dateDebut = new Date(dateString);
        const dateFin = calculerHeureFin(date, heureDebut, duree);
        const rendezvous = {
            name: nom,
            dateDebut: dateDebut,
            dateFin: dateFin,
            description: description,
            agendaId: form.dataset.agendaid
        };
        saveRendezVous(rendezvous);
    }
});

// Fonction pour calculer l'heure de fin
function calculerHeureFin(dateDebut, heureDebut, duree) {
    const dateString = `${dateDebut}T${heureDebut}:00`; // ajoute les secondes, format ISO 8601
    const durationInMilliseconds = duree * 60 * 1000;
    const date = new Date(dateString);
    return new Date(date.getTime() + durationInMilliseconds);
}

async function saveRendezVous(rendezvous) {
    try {
        const response = await fetch(`http://localhost:3000/rendezvous?agendaId=${form.dataset.agendaid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(rendezvous)
        });
        const json = await response.json();
        if (json.ok) {
            const li = document.createElement("li");
            li.innerHTML = `<strong> ${rendezvous.name} </strong> - 
                            du ${new Date(rendezvous.dateDebut).toLocaleString('fr-FR')} au
                            ${new Date(rendezvous.dateFin).toLocaleString('fr-FR')} <br>
                            ${rendezvous.description}`;
            agendaList.appendChild(li);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert("Une erreur s'est produite lors de la création de l'agenda");
    }
}

// Event listener for edit and delete buttons
agendaList.addEventListener('click', async (event) => {
    const rdvId = event.target.dataset.id;

    if (event.target.classList.contains('edit-rdv')) {
        window.location.href = `/rendezvous/edit/${rdvId}`; // Redirection vers la page de modification
    }

    if (event.target.classList.contains('delete-rdv')) {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
            try {
                const response = await fetch(`http://localhost:3000/rendezvous/${rdvId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (response.ok) {
                    alert("Rendez-vous supprimé avec succès !");
                    location.reload(); // Rafraîchir pour retirer le rendez-vous supprimé
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert("Une erreur s'est produite lors de la suppression du rendez-vous.");
            }
        }
    }
});
