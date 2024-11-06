const form = document.getElementById('rendezvous-form');
const agendaList = document.getElementById('agenda-list');
const recurrences = {"week":[],"month":[],"year":[]}

let currentTab = null;
const popUp = document.querySelector(".pop-up-info");
let rdvsOpen = false;

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    const nom = document.getElementById('nom').value;
    const date = document.getElementById('date').value;
    const heureDebut = document.getElementById('heureDebut').value;
    const duree = parseFloat(document.getElementById('duree').value); // Lire la durée en heures
    const description = document.getElementById('description').value;
    const rappel = document.getElementById('rappel').value;
    const finRecurrence = document.getElementById('dateUntilRecurrence').value;
    if (nom && date && heureDebut && duree && description){
        const dateString = `${date}T${heureDebut}:00`; // ajoute les secondes, format ISO 8601
        const dateDebut = new Date(dateString);
        // Calculer l'heure de fin à partir de l'heure de début et de la durée en heures
        const dateFin = calculerHeureFin(date,heureDebut, duree);

        if (dateDebut > new Date(finRecurrence)) {
            afficherPopUp('Date de fin de récurrences plus récentes que la date du rendez-vous.', false)
        } else {
            const rendezvous  = {
                name:nom,
                dateDebut:dateDebut,
                dateFin:dateFin,
                description:description,
                agendaId:form.dataset.agendaid,
                recurrences: recurrences,
                finRecurrence: finRecurrence ? new Date(finRecurrence) : null,
            }
            await saveRendezVous(rendezvous);
        }

    } else {
        afficherPopUp('Certaines informations du rendez-vous sont incorrect ou manquantes.', false)
    }
});

function afficherPopUp(text, good) {
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

document.querySelector("#btn-view-rdv").addEventListener('click', function(event) {
    rdvsOpen = !rdvsOpen
    document.querySelector(".agenda").classList.toggle('agenda-open');
    for (let i = 0; i < document.querySelector("#agenda-list").children.length; i++) {
        document.querySelector("#agenda-list").children[i].classList.toggle('rdv-open');
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
    document.querySelector("#dateUntilRecurrence").value = ''
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
        const json = await response.json();
        if (json.ok) {
            if (agendaList.children[0].id === 'first') agendaList.innerHTML = ''
            afficherPopUp(`Rendez-vous : ${json.rdv.name} ajoutés`, true)
            await updateRdvList(rdvsOpen)
        }
      } catch (error) {
        console.error('Erreur:', error);
        afficherPopUp('Une erreur s\'est produite lors de la création du rendez-vous.', false)
      }
}


async function updateRdvList(opened) {

    const response = await fetch(`http://localhost:3000/rendezvous/api/recurrence?agendaId=${agendaid}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
    });
    const resp = await response.json()
    const rdvs = resp.rdvs

    agendaList.innerHTML = ''
    if (rdvs && rdvs.length === 0) {
        let l = document.createElement("li")
        l.id = "first"
        if (rdvsOpen) l.classList.add("rdv-open")
        l.innerText = "Aucun rendez-vous trouvé."
        agendaList.appendChild(l);
    }
    else {
        rdvs.forEach(rdv => {
            agendaList.appendChild(createLiRdv(rdv, opened))
        })
    }
}
function createLiRdv(rendezvous, opened) {


    const li = document.createElement('li');
    if (opened) {
        li.classList.add('rdv-open')
    }

    const svgModif = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
                <path d="M4485 5110 c-73 -15 -154 -51 -212 -95 -32 -23 -125 -111 -208 -194 l-150 -151 378 -377 377 -378 160 160 c179 179 220 232 256 331 71 196 24 406 -125 555 -127 127 -306 183 -476 149z"/>
                <path d="M2833 3588 c-685 -686 -853 -860 -861 -888 -5 -19 -42 -201 -82 -405 -49 -246 -71 -379 -67 -398 9 -35 39 -65 74 -74 38 -9 801 143 840 167 15 10 406 396 868 859 l840 841 -375 375 c-206 206 -377 375 -380 375 -3 0 -388 -384 -857 -852z"/>
                <path d="M545 4259 c-203 -30 -388 -166 -479 -354 -70 -143 -66 -44 -66 -1772 0 -1740 -4 -1631 72 -1783 73 -145 203 -257 370 -318 l73 -27 1615 0 1615 0 80 27 c207 70 361 234 422 449 17 60 18 125 18 995 l0 931 -30 48 c-44 71 -118 109 -198 102 -70 -6 -125 -39 -164 -99 l-28 -42 -5 -920 c-5 -842 -6 -924 -22 -952 -24 -44 -81 -91 -125 -104 -27 -8 -490 -10 -1584 -8 l-1546 3 -39 27 c-21 15 -50 44 -64 65 l-25 37 -3 1558 c-2 1519 -2 1559 17 1596 11 20 32 49 48 64 63 61 19 58 989 58 673 0 897 3 928 12 57 17 119 82 135 141 27 95 -13 195 -97 244 l-47 28 -900 1 c-495 1 -927 -2 -960 -7z"/>
            </g>
        </svg>
    `;
    const svgDelete = `
        <svg xmlns="http://www.w3.org/2000/svg" width="512.000000pt" height="512.000000pt" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
            <path d="M1925 5114 c-174 -38 -286 -120 -351 -258 -41 -85 -53 -169 -54 -353 l0 -133 105 0 105 0 0 166 c0 100 5 183 12 206 17 57 88 133 146 155 44 17 91 18 672 18 613 0 626 0 670 -21 58 -27 108 -77 134 -134 17 -38 21 -71 24 -217 l4 -173 100 0 101 0 -6 188 c-7 232 -20 280 -105 388 -47 60 -131 119 -209 147 -57 21 -73 22 -693 23 -349 1 -644 0 -655 -2z"/>
            <path d="M742 4234 c-155 -77 -182 -290 -52 -408 78 -70 -46 -66 1865 -66 1945 0 1791 -6 1876 79 34 33 51 61 63 100 20 67 20 84 1 147 -19 66 -67 121 -129 150 l-51 24 -1761 0 -1760 0 -52 -26z"/>
            <path d="M962 1953 l3 -1608 23 -60 c45 -121 131 -212 244 -258 l53 -22 1239 -3 c813 -1 1258 1 1295 8 144 27 262 140 311 298 20 63 20 96 20 1658 l0 1594 -1595 0 -1595 0 2 -1607z m898 1212 c16 -8 34 -24 40 -34 7 -13 10 -422 10 -1241 0 -1353 5 -1257 -65 -1280 -26 -9 -41 -8 -70 4 -69 29 -65 -47 -65 1278 0 1116 1 1195 18 1228 28 56 78 73 132 45z m757 -7 c44 -36 43 -17 43 -1268 0 -1323 4 -1247 -65 -1276 -29 -12 -44 -13 -70 -4 -70 23 -65 -73 -65 1280 0 815 3 1228 10 1240 25 46 107 61 147 28z m752 -13 l26 -25 0 -1229 0 -1229 -24 -26 c-13 -14 -36 -28 -52 -31 -37 -8 -93 18 -108 51 -8 18 -11 353 -11 1242 0 1138 2 1218 18 1238 41 51 106 55 151 9z"/>
            </g>
        </svg>
    `;
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('modif-container');

    const editButton = document.createElement("button");
    editButton.classList.add("edit-rdv");
    editButton.innerHTML = svgModif;

    editButton.addEventListener('click', () => window.location.href = `/rendezvous/edit/${rendezvous.id}`);

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-rdv");
    deleteButton.innerHTML = svgDelete;
    deleteButton.addEventListener('click', async (event) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
            try {
                const response = await fetch(`http://localhost:3000/rendezvous/${rendezvous.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const json = await response.json();
                if (json.ok) {
                    afficherPopUp(json.message, true)
                    li.remove();
                    await updateRdvList(rdvsOpen)
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                afficherPopUp("Une erreur s'est produite lors de la suppression du rendez-vous.", false);
            }
        }
    });


    buttonDiv.appendChild(deleteButton);
    buttonDiv.appendChild(editButton);
    li.appendChild(buttonDiv)

    const title = document.createElement('h3');
    title.textContent = rendezvous.name;
    li.appendChild(title);

    const dateDiv = document.createElement('div');

    const startDate = document.createElement('p');
    startDate.innerHTML = `Date de début : <span>${new Date(rendezvous.dateDebut).toLocaleString('fr-FR')}</span>`;
    dateDiv.appendChild(startDate);
    const endDate = document.createElement('p');
    endDate.innerHTML = `Date de fin : <span>${new Date(rendezvous.dateFin).toLocaleString('fr-FR')}</span>`;
    dateDiv.appendChild(endDate);

    li.appendChild(dateDiv);


    const descriptionText = document.createElement('p');
    descriptionText.textContent = rendezvous.description;
    li.appendChild(descriptionText);
    //////////
    const recurrenceDiv = document.createElement('div');
    recurrenceDiv.classList.add('recurrence-list-rdv');

    const recurrenceTitle = document.createElement('h4');
    recurrenceTitle.textContent = 'Récurrences :';
    recurrenceDiv.appendChild(recurrenceTitle);

    ['Semaine', 'Mois', 'Année'].forEach(name => {
        let div = document.createElement('div');
        let title = document.createElement('h5');
        title.textContent = name + ' :';
        div.appendChild(title);

        let ul = document.createElement('ul');
        if(rendezvous.recurrence)
        {
        rendezvous.recurrence["yearDay"] = rendezvous?.recurrence["yearDay"].map(date => new Date(date).toDateString())
        rendezvous.recurrence[name === "Année" ? 'yearDay' : name === "Mois" ? 'monthDay' : 'weekDay'].forEach((recurrence) => {
            const weekLi = document.createElement('li');
            weekLi.textContent = recurrence;
            ul.appendChild(weekLi);
        });}
        div.appendChild(ul);
        recurrenceDiv.appendChild(div);
    })

    li.appendChild(recurrenceDiv);

    return li;
}



document.addEventListener('DOMContentLoaded', async() => {
    const presetSelect = document.getElementById('preset-select');
    const form = document.getElementById('rendezvous-form');
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
            afficherPopUp("Impossible d'appliquer le préréglage.", false);
        }
    });

    await updateRdvList(false)

});

/*function addRdv() {
    console.log(agendaid)
    const ul = document.querySelector("#agenda-list")

    const response = await fetch(`http://localhost:3000/rendezvous?rdvId=${rdvs.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(rendezvous)
    });
    const resp = await response.json()
    console.log(rdvs)
}*/

const addBoutton = document.querySelector("#addButton")
addBoutton.addEventListener("click",addYearDay)

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

