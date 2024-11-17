
const agendas = []
const fetchEvent = async (el) => {
    
  if (!agendas[el.dataset.id]) {
    const data = await fetch(`/api/getDate?agenda=${el.dataset.id}`).then(res => res.json())
    agendas[el.dataset.id] = { event: data.event, visible: true }
  }
  else {
    agendas[el.dataset.id].visible = true;
  }
    
}
const handleCheckBox = (checkBox)=>{
  const checkBoxs = JSON.stringify(localStorage.getItem("checkBox"));
  if(checkBoxs.includes(checkBox.dataset.id)){
    checkBox.checked = true;
    fetchEvent(checkBox);
  }
}

const saveAgenda =(el)=>{
  let checkBox = JSON.parse(localStorage.getItem("checkBox")) || [];     
  !checkBox.includes(el.dataset.id) ?  checkBox.push(el.dataset.id) : null;
  localStorage.setItem("checkBox",JSON.stringify(checkBox))
}
const unSaveAgenda = (el)=>{
  let checkBox = JSON.parse(localStorage.getItem("checkBox"))
  let index = checkBox.indexOf(el.dataset.id)
  
  if(index !== -1){
    console.log(true)
    checkBox.splice(index, 1)
    localStorage.setItem("checkBox",JSON.stringify(checkBox));
  }
}
const refetch = async (el, calendar) => {
  if (el.checked) {
    saveAgenda(el)
    fetchEvent(el)
  }
  else {
    agendas[el.dataset.id].visible = false;
    unSaveAgenda(el)
    }
    calendar.refetchEvents()
  }
let popupActivated = false;
let allAgenda = null;
(async () => {
    let response = await fetch(`/api/getAgenda`)
    allAgenda = await response.json();
})()
function showTooltip(eventRect, event, size) {
    const tooltip = document.getElementById('event-tooltip') ||
        document.createElement('div');
    tooltip.id = 'event-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style = `
                  position:absolute;
                  top:${(eventRect.top)}px;
                  left:${eventRect.left}px;
                  width:${size.width}px;
                  border:2px solid black;
                  background:#3788d8;
                  z-index:999999;
                  transform:translateY(-100%);
            `
    const startHour = (event.start.getHours() < 10 ? "0" : "") + event.start.getHours()
    const startMinutes = (event.start.getMinutes() < 10 ? "0" : "") + event.start.getMinutes()
    const startSecondes = (event.start.getSeconds() < 10 ? "0" : "") + event.start.getSeconds()
    const endHour = (event.end.getHours() < 10 ? "0" : "") + event.end.getHours()
    const endMinutes = (event.end.getMinutes() < 10 ? "0" : "") + event.end.getMinutes()
    const endSecondes = (event.end.getSeconds() < 10 ? "0" : "") + event.end.getSeconds()
    tooltip.innerText = `${event.title}
              ${startHour}:${startMinutes}:${startSecondes} - ${endHour}:${endMinutes}:${endSecondes}
              ${event.extendedProps.description}
            `


    if (!document.getElementById('event-tooltip')) {
        document.body.appendChild(tooltip);
    }
}
document.addEventListener('DOMContentLoaded', function () {
  const selectAllButton = document.querySelector(".selectAll");
  const unSelectAllbutton = document.querySelector(".unSelectAll");  
  
    const rdv = {
        name:"",
        color:'',
        realEvent:null,
        id:null,
        dateDebut:new Date(),
        dateFin:new Date(),
        rappel:0,
        extendedProps: {agenda_id:null},
        description:"",
        recId:null,
        recurrences:{},
        priorite:0,
      }
    initPopUpRdv(rdv)


    document.querySelector("#MICHAEL").addEventListener('click', async() => {
        console.log(rdv)
    })
    const fetchModif = async (rdv)=>{
        //je recherche s'il existe un rendez-vous dejà enregistré dans le cache
        let index = agendas[rdv.extendedProps.agenda_id].event.findIndex(el=>el.id===rdv.id)
        if(index!==-1){
            agendas[rdv.extendedProps.agenda_id].event.splice(index, 1)
        }
        let event = agendas[rdv.extendedProps.agenda_id]?.event ? [...agendas[rdv.extendedProps.agenda_id]?.event ,rdv.realEvent] : [rdv.realEvent] 
        agendas[rdv.extendedProps.agenda_id] = { event: event, visible: true }
        const fetchOptions = {
            method: 'put',
            headers: {
                'Content-Type': 'application/json'
                    },
            credentials: 'include',
            body: JSON.stringify(rdv),
          }
        fetch(`/rendezvous/${rdv.id}`,fetchOptions);
    }
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        eventSources: [
            async (info, success, fail) => {
                let events = []
                for (agenda in agendas) {
                    if (agendas[agenda].visible) {
                        events = [...events, ...agendas[agenda].event]
                    }
                }

                return events;
            }
        ],

        allDaySlot: false,
        nowIndicator: true,
        height: "100%",
        initialView: 'timeGridWeek',
        views: {
            dayGridMonth: {
                dayHeader: false,
                /*dayHeaderFormat: { weekday: 'long'  },
                titleFormat: { month: 'long' }*/
            },
            timeGridWeek: {
                dayHeaderFormat: { weekday: 'long', day: 'numeric' },
                titleFormat: { month: 'long' }
            },
            /*timeGridDay: {
                dayHeaderFormat: { weekday: 'long' },
                titleFormat: { month: 'long' }
            }*/
        },
        expandRows: true,
        locale: 'fr',
        firstDay: 1,
        headerToolbar: {
            start: 'title',
            center: "timeGridWeek,dayGridMonth",
            end: 'today prev,next',
        },
        buttonText: {
            today: "Aujourd'hui",
            week: "Semaine",
            month: "Mois"
        },
        displayEventEnd: true,

        eventMouseEnter: (mouseInfo) => {
            let eventRect = mouseInfo.el.getBoundingClientRect();
            let size = { width: mouseInfo.el.offsetWidth, height: mouseInfo.el.offsetHeight }
            showTooltip(eventRect, mouseInfo.event, size); 
        },
        eventMouseLeave: (mouseLeaveInfo) => {
            const popup = document.querySelector("#event-tooltip") 
            popup.remove()
        },
        eventClick: (info) => {
            console.log(info)
            if (info.view.type === "timeGridWeek"){
              console.log("c'est eventCLick")
                drawPopUpRdv(rdv, info, false, calendar)
            }
           /* window.location.href = `${info.event.extendedProps.link}`;*/
        },


        /** DRAG DROP ET Pop-up **/

        dateClick: (info) => {
            console.log("click")
            if (info.view.type === "timeGridWeek") {
                drawPopUpRdv(rdv, info, true, calendar)

            }
        },
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00',
        slotLabelFormat: {
            hour: '2-digit',
            hour12: false
        },
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',

        editable: true,  // Enable drag-and-drop
        selectable: true, // Enable selection
        selectMirror: true, // Show drag preview

        // Selection settings
        unselectAuto: true,
        unselectCancel: '#popup-rdv', // Don't unselect when clicking popup
        selectOverlap: false, // Don't allow selection where events exist
        selectMinDistance: 10, // Minimum drag distance

        // Snap settings
        snapDuration: '00:15:00', // Snap to 15-minute intervals
        dragScroll: true,

        eventDragStart: function(info) {
            console.log("drag")
            info.el.style.opacity = '0.5';
            if(popupActivated && info.event.id !=="null"){
                console.log(info.event.id!== null)
                console.log(info.event.id)
                console.log(popupActivated)
                
                console.log("je ferme la popup");
                rdv.realEvent.remove()
                popupActivated = false;
                togglePopUp()
            }
        },
        eventDrop: async function(info) {
            console.log("drop")
            info.el.style.opacity = '1';
            console.log(info)
            const event = info.event;
            const newStart = event.start;
            const newEnd = event.end;
          
            console.log(info)
            const rdv = {
              name:event.title, 
              realEvent:event,
              id:info.event.id,
              dateDebut:newStart,
              dateFin:newEnd,
              color:info.event.color,
              extendedProps: {agenda_id:event.extendedProps.agenda_id},
            }
            const popup = document.querySelector("#event-tooltip") 
            popup !==null ? popup.remove():null
          
            updateRdvEvent(rdv)
            if(rdv.id === "null"){
              updatePopUp(rdv)
            }else{
                fetchModif(rdv)
            }
        },
        
        /*unselect: function(info) {
            console.log("unselect")
            console.log(info)
            const allowedRect = document.querySelector("#popup-rdv").getBoundingClientRect()

            /!*if (!(allowedRect.x < info.jsEvent.clientX && info.jsEvent.clientX < allowedRect.right &&
            allowedRect.y < info.jsEvent.clientY && info.jsEvent.clientY < allowedRect.bottom)) {*!/
            console.log("nope")
            rdv.realEvent.remove()
            popupActivated = false;
            togglePopUp()

        },*/
        eventResize: function(info) {
            console.log("resize")
            
            const event = info.event;
            const newStart = event.start;
            const newEnd = event.end;
            if(info.event.id === "null"){
                rdv.dateDebut= newStart;
                rdv.dateFin = newEnd;
                updatePopUp(rdv)
                updateRdvEvent(rdv)
            }
            else{
                const rdv = {
                    name:event.title, 
                    realEvent:event,
                    id:info.event.id,
                    dateDebut:newStart,
                    dateFin:newEnd,
                    color:info.event.color,
                    extendedProps: {agenda_id:event.extendedProps.agenda_id},
                  }
                  updateRdvEvent(rdv)
                  fetchModif(rdv)
            }
            
            
            
            
        }

    });


    const sideBar = document.querySelector(".sideBar");
    calendar.render();
    const menu = document.querySelector(".menu");
    menu.addEventListener("click", () => {
        sideBar.classList.toggle("sideBar-open");
        setTimeout(() => {
            calendar.updateSize();
        }, 500)
    })

    const checkBoxs = document.querySelectorAll(".listAgenda input");
    const saveChecboxs = JSON.stringify(localStorage.getItem("checkBox"))
    checkBoxs.forEach(checkBox => {
        if(saveChecboxs.includes(checkBox.dataset.id)){
          checkBox.checked = true;
          fetchEvent(checkBox)
        }
        checkBox.addEventListener("change", (el) => {
            refetch(el.target, calendar)
        })
    });
 
    selectAllButton.addEventListener("click",(e)=>{
  
      const checkBoxs = document.querySelectorAll(".checkAgenda");
      checkBoxs.forEach(checkBox=>{
        checkBox.checked = true
        saveAgenda(checkBox)
        fetchEvent(checkBox)
      })
    })
    unSelectAllbutton.addEventListener("click",(e)=>{
      console.log("toto2")
      const checkBoxs = document.querySelectorAll(".checkAgenda");
      
      checkBoxs.forEach(checkBox=>{
        checkBox.checked = false
        agendas[checkBox.dataset.id].visible = false;
        unSaveAgenda(checkBox)
      })
      calendar.refetchEvents()
    })
 
     dateSelector.addEventListener("change",(e)=>{
      calendar.gotoDate(e.target.value)
     })
});


function drawPopUpRdv(rdv2, info, click, calendar) {
    if (!popupActivated) {
        popupActivated = true
        let eventStart
        let eventEnd
    
        if (click) {
            
            eventStart = info.date;
            eventStart.setMinutes(0, 0, 0);
            eventEnd = new Date(eventStart.getTime() + 3600000);
           rdv = {
            name:"",
            color:'',
            realEvent:null,
            id:"null",
            dateDebut:eventStart,
            dateFin:eventEnd,
            rappel:0,
            extendedProps: {agenda_id:null},
            description:"",
            recId:null,
            recurrences:{},
            priorite:0,
          }
        const newEvent = {
                id:"null",
                title: 'Nouveau Evenement',
                start: eventStart,
                end: eventEnd,
                color:"#3788d8",
                editable: true,
                extendedProps:{
                    agenda_id:null,
                    recId:null,
                    rappel:0,
                    priorite:"basse"
                },
                duration:eventEnd-eventStart
            };
            console.log("c'est clique")
            rdv.realEvent = calendar.addEvent(newEvent)
            rdv.name = newEvent.title;
            rdv.dateDebut = newEvent.start;
            rdv.dateFin = newEvent.end;
            rdv.color = newEvent.backgroundColor;
            console.log(rdv)
        } else {
            console.log("c'est pas clique")
            rdv = {
                name:info.event.title,
                color:info.event.color,
                realEvent:info.event,
                id:info.event.id,
                dateDebut:info.event.start,
                dateFin:info.event.end,
                rappel:info.event.extendedProps.rappel,
                extendedProps: {agenda_id:info.event.extendedProps.agenda_id},
                description:info.event.extendedProps.description,
                recId:info.event.extendedProps.recId,
                recurrences:info.event.extendedProps.recurrences,
                priorite:info.event.extendedProps.priorite,
              }
        }
       
        updatePopUp(rdv)
        togglePopUp(info.jsEvent.clientX, info.jsEvent.clientY)
    } else {
        if(rdv.realEvent.id === "null"){
            rdv.realEvent.remove()
        }
        popupActivated = false;
        togglePopUp()
        
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

function togglePopUp(x, y) {
    document.querySelectorAll("button").forEach(b => {
        b.disabled = !b.disabled;
    })
    document.querySelectorAll("input[type='checkbox']").forEach(b => {
        b.disabled = !b.disabled;
    })
    document.querySelector("#popup-rdv").querySelectorAll("button").forEach(b => {
        b.disabled = !b.disabled;
    })

    if (x && y) {
        if (x < 600) { // a droite
            document.querySelector("#popup-rdv").style.left = (x+400) * 100 / window.innerWidth + "%";
        } else {    // a gauche
            document.querySelector("#popup-rdv").style.left = (x-400) * 100 / window.innerWidth + "%";
        }
    }

    document.querySelector("#popup-rdv").classList.toggle("display-pop-up")

}


function updatePopUp(rdv, newEvent) {

    //miseAJourDuNom
    //de la description
    //de la couleur
    //selection agenda
    //priorite
    //rappel
    document.querySelector('#date').value = rdv.dateDebut.toLocaleString('en-CA').split(',')[0];
    document.querySelector('#startrdvtime').value = rdv.dateDebut.toTimeString().slice(0, 5);
    document.querySelector('#endrdvtime').value = rdv.dateFin.toTimeString().slice(0, 5);

}
function initPopUpRdv(rdv) {

    const container = document.querySelector('.infoDate');
    const pickers = container.querySelectorAll('.time-picker');

    pickers.forEach(picker => {
        const input = picker.querySelector('.time-input');
        const dropdown = picker.querySelector('.time-dropdown');
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const timeOption = document.createElement('div');
                timeOption.className = 'time-option';

                timeOption.textContent = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                timeOption.addEventListener('click', () => {
                    const input = dropdown.parentNode.querySelector('.time-input');
                    input.value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    dropdown.style.display = 'none';


                    if (picker.firstElementChild.id === "startrdvtime") {
                        rdv.dateDebut.setHours(hour, minute)
                    } else {
                        rdv.dateFin.setHours(hour, minute)
                    }
                    updateRdvEvent(rdv)
                });

                dropdown.appendChild(timeOption);
            }
        }

        // Add event listeners
        input.addEventListener('click', () => {
            pickers.forEach(p => {
                const otherDropdown = p.querySelector('.time-dropdown');
                if (otherDropdown !== dropdown) {
                    otherDropdown.style.display = 'none';
                }
            });

            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!picker.contains(e.target)) {
                dropdown.style.display = 'none';
            }
            if (!agendaButton.contains(e.target) && !agendaDropdown.contains(e.target)) {
                agendaDropdown.classList.remove('show');
            }
            if (!colorButton.contains(e.target) && !colorDropdown.contains(e.target)) {
                colorDropdown.classList.remove('show');
            }
        });
    });


    const toggleBtn = document.getElementById('toggleBtn');
    const menuIcon = document.querySelector('.menu-icon');
    const closeIcon = document.querySelector('.close-icon');
    const textareaContainer = document.getElementById('textareaContainer');
    const labelText = document.getElementById('labelText');

    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = textareaContainer.classList.toggle('open');
        menuIcon.style.display = isOpen ? 'none' : 'block';
        closeIcon.style.display = isOpen ? 'block' : 'none';
        labelText.textContent = isOpen ? 'Description' : 'Description';
    });

    document.querySelector(".closer").addEventListener('click', function(event) {
        rdv.realEvent.remove()
        popupActivated = false;
        togglePopUp()
    })




    const colors = [
        { name: 'Blue', hex: '#2196F3' },
        { name: 'Red', hex: '#F44336' },
        { name: 'Pink', hex: '#E91E63' },
        { name: 'Orange', hex: '#FF9800' },
        { name: 'Yellow', hex: '#FFC107' },
        { name: 'Green', hex: '#4CAF50' },
        { name: 'Purple', hex: '#9C27B0' },
        { name: 'Light Blue', hex: '#03A9F4' },
        { name: 'Gray', hex: '#9E9E9E' }
    ];

    const colorButton = document.getElementById('colorButton');
    const colorDropdown = document.getElementById('colorDropdown');
    const selectedColorDot = document.querySelector('.selected-color');
    let selectedColor = colors[0].hex;

    selectedColorDot.style.backgroundColor = selectedColor;

    colors.forEach(color => {
        const option = document.createElement('div');
        option.className = 'color-option';
        option.innerHTML = `
        <div class="color-dot" style="background-color: ${color.hex}">
          ${color.hex === selectedColor ? '<span class="checkmark">✓</span>' : ''}
        </div>
      `;

        option.addEventListener('click', () => {
            selectedColor = color.hex;
            selectedColorDot.style.backgroundColor = color.hex;

            document.querySelectorAll('.color-dot').forEach(dot => {
                dot.innerHTML = dot.style.backgroundColor === color.hex ? '<span class="checkmark">✓</span>' : '';
            });

            colorDropdown.classList.remove('show');
            rdv.color = selectedColor
            updateRdvEvent(rdv)

        });

        colorDropdown.appendChild(option);
    });

    colorButton.addEventListener('click', (e) => {
        e.preventDefault()
        colorDropdown.classList.toggle('show');
    });


    const agendaButton = document.getElementById('agendaButton');
    const agendaDropdown = document.getElementById('agendaDropdown');

    async function loadAgendas() {
        agendaDropdown.innerHTML = ""

        allAgenda.forEach(agenda => {
            const option = document.createElement('div');
            option.className = 'agenda-option';
            option.innerHTML = `
              <span>${agenda.name}</span>
            `;

            option.addEventListener('click', () => {
                const buttonContent = agendaButton.querySelector('.agenda-name');
                buttonContent.innerHTML = `
                    ${agenda.name}
                  `;

                agendaDropdown.classList.remove('show');

                console.log('Selected agenda:', agenda);
                rdv.extendedProps.agenda_id = agenda._id;
            });

            agendaDropdown.appendChild(option);
        });
    }



    agendaButton.addEventListener('click', async (e) => {
        e.preventDefault()
        agendaDropdown.classList.toggle('show');
        await loadAgendas();
    });

    document.querySelector("#date").addEventListener('change', (e) => {
        let t = rdv.dateDebut
        let t2 = rdv.dateDebut
        rdv.dateDebut = new Date(e.target.value)
        rdv.dateDebut.setHours(t.getHours(), t.getMinutes());
        rdv.dateFin = new Date(e.target.value)
        rdv.dateFin.setHours(t2.getHours(), t2.getMinutes());
        updateRdvEvent(rdv)
    })
    document.querySelector("#namerdv").addEventListener('change', (e) => {
        rdv.name = e.target.value
        updateRdvEvent(rdv)
    })


    document.querySelector("#rendezvous-form").addEventListener('submit', async(e) => {
        e.preventDefault()
        document.querySelector("#rendezvous-form").classList.toggle('hide');
        rdv.description = document.querySelector("#textareaContainer").value
        let index = agendas[rdv.extendedProps.agenda_id].event.indexOf(el=>el.id===rdv.id)
        if(index!=-1){
            agenda[rdv.extendedProps.agenda_id].splice(index, 1)
        }
        let event = agendas[rdv.extendedProps.agenda_id]?.event ? [...agendas[rdv.extendedProps.agenda_id]?.event,rdv.realEvent] : rdv.realEvent 
        agendas[rdv.extendedProps.agenda_id] = { event: event, visible: true }
        console.log("FINAL RDV : ", rdv)
        if(rdv.id !== "null"){
            //completer les champs avec rappel et priorité
            fetchModif(rdv);
        }
        else{
            const fetchOptions = {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json'
                        },
                credentials: 'include',
                body: JSON.stringify(rdv),
              }
            fetch(`/rendezvous}`,fetchOptions).then(res=>res.json()).then(data=>{
                togglePopUp();
                //completer les informations manquante du realEvent voir modèles RDV 
                /* name:info.event.title,
                color:info.event.color,
                realEvent:info.event,
                id:info.event.id,
                dateDebut:info.event.start,
                dateFin:info.event.end,
                rappel:info.event.extendedProps.rappel,
                extendedProps: {agenda_id:info.event.extendedProps.agenda_id},
                description:info.event.extendedProps.description,
                recId:info.event.extendedProps.recId,
                recurrences:info.event.extendedProps.recurrences,
                priorite:info.event.extendedProps.priorite,*/
            })
        }
        
    })
}

// link realEvent on rdv Model
function updateRdvEvent(rdv) {
   
    rdv.realEvent.setProp('title', rdv.name)
    rdv.realEvent.setProp('backgroundColor', rdv.color)
    rdv.realEvent.setStart(rdv.dateDebut)
    rdv.realEvent.setEnd(rdv.dateFin)

}

