

const form = document.getElementById('rendezvous-form');
const agendaList = document.getElementById('agenda-list');
const recurrences = {"week":[],"month":[],"year":[]}

const recurrencesList = []
let currentTab = null;

form.addEventListener('submit', function(event) {
    event.preventDefault();
    const nom = document.getElementById('nom').value;
    const date = document.getElementById('date').value;
    const heureDebut = document.getElementById('heureDebut').value;
    const duree = parseFloat(document.getElementById('duree').value); // Lire la durée en heures
    const description = document.getElementById('description').value;
    const rappel = document.getElementById('rappel').value;
    const finRecurrence = document.getElementById('dateUntilRecurrence').value;
    if(!(!nom || !date || !heureDebut || !duree || !description)){
    const dateString = `${date}T${heureDebut}:00`; // ajoute les secondes, format ISO 8601
    const dateDebut = new Date(dateString);
    // Calculer l'heure de fin à partir de l'heure de début et de la durée en heures
    const dateFin = calculerHeureFin(date,heureDebut, duree);
    const rendezvous  = {
        name:nom,
        dateDebut:dateDebut,
        dateFin:dateFin,
        description:description,
        agendaId:form.dataset.agendaid,
        recurrences: recurrences,
        finRecurrence: new Date(finRecurrence),
    }
    saveRendezVous(rendezvous);
    }
});
const showText = function (target, message, index, interval) {
    if (index < message.length) {
        target.textContent += (message[index++]);
        setTimeout(function () { showText(target, message, index, 20); }, interval);
    }
}
document.querySelector("#btn-view-rdv").addEventListener('click', function(event) {
    document.querySelector(".agenda").classList.toggle('agenda-open');
    for (let i = 0; i < document.querySelector("#agenda-list").children.length; i++) {
        document.querySelector("#agenda-list").children[i].classList.toggle('rdv-open');
    }
    if (document.querySelector(".agenda").classList.contains("agenda-open")) {
        const texts = []
        for (let i = 0; i < document.querySelector("#agenda-list").children.length; i++) {
            texts.push(" "+document.querySelector("#agenda-list").children[i].innerText);
            document.querySelector("#agenda-list").children[i].innerHTML = '';
            showText(document.querySelector("#agenda-list").children[i], texts[i], 0, 1000);
        }
    }
})

document.querySelector("#btn-recurrence").addEventListener('click', function(event) {
    document.querySelector(".wrapper").querySelectorAll("button").forEach(b => {
        b.disabled = !b.disabled;
    })

    document.querySelector(".wrapper-pop-up").style.display = 'flex';

})

document.querySelector(".closer").addEventListener('click', function(event) {
    document.querySelector(".wrapper").querySelectorAll("button").forEach(b => {
        b.disabled = !b.disabled;
    })

    document.querySelector(".wrapper-pop-up").style.display = 'none';

})

function clearSelection() {
    recurrences[currentTab] = []
    Array.from(document.querySelector(`#${currentTab}`).children).forEach(c => {
        c.classList.remove('selected')
    })
}
function openMode(e, mode) {

    document.querySelectorAll(".tabcontent").forEach(tab => {
        if (tab.id === mode) {
            tab.style.display = 'flex';
        } else {
            tab.style.display = 'none';
        }
    })
    currentTab = mode

    document.querySelectorAll(".tablinks").forEach(b => {
        b.parentElement.classList.remove("active");
    })
    e.parentElement.classList.add("active");
    document.querySelectorAll(".tabcontent").forEach(b => {
        b.style.border = '1px solid #cfbff7';
        b.style.borderTop = 'none'
    })
    document.querySelector(".common").style.removeProperty('border-top')
    document.querySelector(".common").style.border = '1px solid #cfbff7'
}

// Fonction pour calculer l'heure de fin
function calculerHeureFin(dateDebut,heureDebut, duree) {


    const dateString = `${dateDebut}T${heureDebut}:00`; // ajoute les secondes, format ISO 8601
    const durationInMilliseconds = duree * 60 * 1000;
    const date = new Date(dateString);
    const [heures, minutes] = heureDebut.split(':').map(Number);

    return new Date(date.getTime()+durationInMilliseconds);
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
        const json = await response.json()
        if (json.ok) {
          const li = document.createElement("li");
          li.innerHTML =  `<strong> ${rendezvous.name} </strong> - 
          du
           ${new Date(rendezvous.dateDebut).toLocaleString('fr-FR')} au
          ${new Date(rendezvous.dateFin).toLocaleString('fr-FR')} <br>
          ${rendezvous.description}`


          // Ajouter le nouvel agenda au conteneur principal
            li.classList.add('rdv-open');
          agendaList.appendChild(li);
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur s\'est produite lors de la création de l\'agenda');
      }

  };

 
document.addEventListener('DOMContentLoaded', () => {
  const presetSelect = document.getElementById('preset-select');
  const form = document.getElementById('rendezvous-form');


function selectDay(e, day) {

    e.classList.toggle("selected")
    const index = recurrences[currentTab].indexOf(day);

    if (index===-1) {
        recurrences[currentTab].push(day);
    } else {
        recurrences[currentTab].splice(index, 1);
    }

}

function addYearDay() {
    const date = new Date(document.querySelector("#dateYearRecurrence").value)

    if (date.getDate()) {
        const index = recurrences.year.findIndex(e => e.toString() === date.toString());
        if (index === -1) {
            const li = document.createElement("li");
            li.textContent = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

            const button = document.createElement("button");
            button.type = "button"
            button.addEventListener('click', function(e) {
                recurrences.year.splice(index, 1);
                e.currentTarget.parentNode.remove()
            })

            li.appendChild(button)
            document.querySelector(".yearList").appendChild(li)
            recurrences.year.push(date);
        } else {
            console.log("Date déjà ajoutés")
        }
        document.querySelector("#dateYearRecurrence").value = ''
    }

}

  presetSelect.addEventListener('change', async () => {
      const presetId = presetSelect.value;
      if (!presetId) return;

      const confirmApply = confirm("Voulez-vous vraiment appliquer ce préréglage ? Cela remplacera les valeurs actuelles du formulaire.");
      if (!confirmApply) {
          presetSelect.value = "";
          return;
      }

      try {
          const response = await fetch(`/api/presets/${presetId}`);
          if (!response.ok) throw new Error("Erreur lors de la récupération du préréglage");
          
          const presetData = await response.json();

          // Remplit les champs du formulaire avec les données du préréglage sélectionné
          form.nom.value = presetData.eventName || '';
          form.duree.value = presetData.duration;
          form.description.value = presetData.description || '';
          form.rappel.value = presetData.reminder || '';
          form.heureDebut.value = presetData.startHour || '';
      } catch (error) {
          console.error("Erreur:", error);
          alert("Impossible d'appliquer le préréglage.");
      }
  });
});

function selectDay(e, day) {

    e.classList.toggle("selected")
    const index = recurrences[currentTab].indexOf(day);

    if (index===-1) {
        recurrences[currentTab].push(day);
    } else {
        recurrences[currentTab].splice(index, 1);
    }

}

function addYearDay() {
    const date = new Date(document.querySelector("#dateYearRecurrence").value)

    if (date.getDate()) {
        const index = recurrences.year.findIndex(e => e.toString() === date.toString());
        if (index === -1) {
            const li = document.createElement("li");
            li.textContent = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

            const button = document.createElement("button");
            button.type = "button"
            button.addEventListener('click', function(e) {
                recurrences.year.splice(index, 1);
                e.currentTarget.parentNode.remove()
            })

            li.appendChild(button)
            document.querySelector(".yearList").appendChild(li)
            recurrences.year.push(date);
        } else {
            console.log("Date déjà ajoutés")
        }
        document.querySelector("#dateYearRecurrence").value = ''
    }

}


function selectDay(e, day) {

    e.classList.toggle("selected")
    const index = recurrences[currentTab].indexOf(day);

    if (index===-1) {
        recurrences[currentTab].push(day);
    } else {
        recurrences[currentTab].splice(index, 1);
    }

}

function addYearDay() {
    const date = new Date(document.querySelector("#dateYearRecurrence").value)

    if (date.getDate()) {
        const index = recurrences.year.findIndex(e => e.toString() === date.toString());
        if (index === -1) {
            const li = document.createElement("li");
            li.textContent = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

            const button = document.createElement("button");
            button.type = "button"
            button.addEventListener('click', function(e) {
                recurrences.year.splice(index, 1);
                e.currentTarget.parentNode.remove()
            })

            li.appendChild(button)
            document.querySelector(".yearList").appendChild(li)
            recurrences.year.push(date);
        } else {
            console.log("Date déjà ajoutés")
        }
        document.querySelector("#dateYearRecurrence").value = ''
    }

}

