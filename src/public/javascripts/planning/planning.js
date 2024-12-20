function hexToRgb(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
  }
//modèle d'un rdv 
let rdv = {
    name:"",
    backgroundColor:"#3788d8",
    realEvent:null,
    id:null,
    dateDebut:new Date(),
    dateFin:new Date(),
    rappel:0,
    agendaId:null,
    description:"",
    recId:null,
    recurrences:{},
    priorite:"Moyenne",
  }
let agendaObject
fetch("/api/getAgenda").then(res=>res.json()).then(data => agendaObject = data)
const agendas = []
const agendasMonth = [];
let view;
let month;
let weeks;
let popupActivated = false;

const handleCheckBox = (checkBox)=>{
  const checkBoxs = JSON.stringify(localStorage.getItem("checkBox"));
  if(checkBoxs.includes(checkBox.dataset.id)){
    checkBox.checked = true;
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
    checkBox.splice(index, 1)
    localStorage.setItem("checkBox",JSON.stringify(checkBox));
  }
}
function showTooltip(eventRect, event, size) {
    // Créer ou récupérer le tooltip
    const tooltip = document.getElementById('event-tooltip') || document.createElement('div');
    tooltip.id = 'event-tooltip';

    tooltip.style = `
        position: absolute;
        top: ${eventRect.top}px;
        left: ${eventRect.left+size.width}px;
       
        max-width: 250px; /* Limite la taille pour éviter des textes trop longs */
        padding: 15px;
        background: rgba(30, 40, 50, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        line-height: 1.5;
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
        opacity: 0;
        transform: scale(0.9) translateY(-10px);
        transition: opacity 0.4s ease, transform 0.4s ease;
        z-index: 9999;
    `;

    // Ajout d'une flèche
    const arrow = `
        <div style="
            position: absolute;
            bottom: -10px;
            left: 20px;
            width: 10px;
            height: 10px;
            background: rgba(30, 40, 50, 0.95);
            border-left: 1px solid rgba(255, 255, 255, 0.2);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            transform: rotate(45deg);
        "></div>
    `;

    // Mise en forme du contenu
    const startTime = `${event.start.getHours().toString().padStart(2, '0')}:${event.start.getMinutes().toString().padStart(2, '0')}`;
    const endTime = `${event.end.getHours().toString().padStart(2, '0')}:${event.end.getMinutes().toString().padStart(2, '0')}`;
    const content = `
        <strong style="font-size: 16px; color: #f1c40f; width: 100%; overflow-x: hidden; display: block; text-overflow: ellipsis;">${agendaObject.find(el=>event.extendedProps.agendaId == el._id).name} | ${event.title}</strong>
        <div style="margin-top: 5px;">
            🕒 ${startTime} - ${endTime}
        </div>
        <p style="margin-top: 8px; font-size: 13px; color: #d1d1d1;">
            ${event.extendedProps.description || "Aucune description"}
        </p>
    `;
    tooltip.innerHTML = content + arrow;

    // Ajout au DOM si le tooltip n'est pas déjà dans le DOM
    if (!document.getElementById('event-tooltip')) {
        document.body.appendChild(tooltip);

        // Animation d'apparition
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'scale(1) translateY(0)';
        });
    }

    // Empêcher la disparition lorsque la souris est sur le tooltip
    tooltip.addEventListener('mouseenter', () => {
        tooltip.style.transition = 'none'; // Empêche les transitions lors du survol
        tooltip.style.opacity = '1'; // Garde le tooltip visible
        tooltip.style.transform = 'scale(1) translateY(0)'; // Empêche le mouvement
    });

    tooltip.addEventListener('mouseleave', () => {
        // Lorsque la souris quitte le tooltip, réactiver la transition
        tooltip.style.transition = ''; // Restaure les transitions après le survol
        tooltip.style.opacity = '0'; // Masquer le tooltip après un délai
        tooltip.style.transform = 'scale(0.9) translateY(-10px)';
    });
}



const fetchEvent = async (el,calendar) => {
    
    
    //je regarde si j'ai déjà récuperer les 
    if(calendar.view.type == "timeGridWeek"){
        const start = new Date(weeks.start).getTime();
        if(!agendas[el.dataset.id]){
            agendas[el.dataset.id] = {event:[],visible:el.checked,permissions:"",weeks:[]}
        }
        if (!agendas[el.dataset.id] || !agendas[el.dataset.id]?.weeks.includes(start)) {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                        },
                credentials: 'include',
                body: JSON.stringify({weekStart:weeks.start,weekEnd:weeks.end}),
              }
              
          const data = await fetch(`/api/getDate?agenda=${el.dataset.id}&weekStart=${weeks.start}&weekEnd=${weeks.end}`).then(res => res.json())
          agendas[el.dataset.id] = { event: [...agendas[el.dataset.id].event,...data.event], visible: el.checked,permissions:data.permission,weeks:[...agendas[el.dataset.id].weeks,start] }
          
        }
        else {
          agendas[el.dataset.id].visible = true;
        }
        calendar.refetchEvents()
    }else{
        const start = new Date(month.start).getTime();
        if(!agendasMonth[el.dataset.id]){
            agendasMonth[el.dataset.id] = {event:[],visible:el.checked,permissions:"",month:[]}
        }
        if (!agendasMonth[el.dataset.id] || !agendasMonth[el.dataset.id]?.month.includes(start)) {
          
         
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                        },
                credentials: 'include',
                body: JSON.stringify({weekStart:month.start,weekEnd:month.end}),
              }
          const data = await fetch(`/api/getDate?agenda=${el.dataset.id}&weekStart=${month.start}&weekEnd=${month.end}`).then(res => res.json())
          agendasMonth[el.dataset.id] = { event: [...agendasMonth[el.dataset.id].event,...data.event], visible: el.checked,permissions:data.permission,month:[...agendasMonth[el.dataset.id].month,start]}

          calendar.refetchEvents();
        }
        else {
          agendasMonth[el.dataset.id].visible = true;
        }
    }
    

  }
const refetch = async (el, calendar) => {
    if (el.checked) {
      saveAgenda(el)
      fetchEvent(el,calendar)
    }
    else {
       if(view == "timeGridWeek"){
           agendas[el.dataset.id].visible = false;
       }else{
        agendasMonth[el.dataset.id].visible = false;
       }
      
      unSaveAgenda(el)
      }
      calendar.refetchEvents()
    }
let allAgenda = null;
(async () => {
    let response = await fetch(`/api/getAgenda`)
    allAgenda = await response.json();
})()

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

   /* if (x && y) {
        if (x < 600) { // a droite
            document.querySelector("#popup-rdv").style.left = (x+400) * 100 / window.innerWidth + "%";
        } else {    // a gauche
            document.querySelector("#popup-rdv").style.left = (x-400) * 100 / window.innerWidth + "%";
        }
    }*/

    document.querySelector("#popup-rdv").classList.toggle("display-pop-up")

}

document.addEventListener('DOMContentLoaded', function () {
  const selectAllButton = document.querySelector(".selectAll");
  const unSelectAllbutton = document.querySelector(".unSelectAll");  
  
    

  const fetchModif = async (rdv)=>{
    //je recherche s'il existe un rendez-vous dejà enregistré dans le cache
    let index = agendas[rdv.agendaId].event.findIndex(el=>el.id===rdv.id)
    if(index!==-1){
        agendas[rdv.agendaId].event.splice(index, 1);
    }
    let event = agendas[rdv.agendaId]?.event ? [...agendas[rdv.agendaId]?.event ,rdv.realEvent] : [rdv.realEvent] 
    agendas[rdv.agendaId] = { event: event, visible: true }
    const fetchOptions = {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
                },
        credentials: 'include',
        body: JSON.stringify(rdv),
      }

    fetch(`/rendezvous/${rdv.id}?agendaId=${rdv.agendaId}`,fetchOptions).then((data)=>{
        if(popupActivated){
            popupActivated = false;
            togglePopUp()
            document.querySelector(".description-textarea").value = ""
            document.querySelector("#namerdv").value = ""
        }
    })
    //rdv.realEvent.setProp("backgroundColor",rdv.backgroundColor)  
}
    /*document.querySelector("#MICHAEL").addEventListener('click',() => {
        console.log(rdv)
    })*/
        const checkBoxs = document.querySelectorAll(".listAgenda input");
    const saveChecboxs = JSON.stringify(localStorage.getItem("checkBox"))
    checkBoxs.forEach(checkBox => {
        if(saveChecboxs.includes(checkBox.dataset.id)){
          checkBox.checked = true;
         
        }
        checkBox.addEventListener("change", (el) => {
            refetch(el.target, calendar)
        })
    }
    );
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        datesSet:function(dateInfo){
            view = dateInfo.view.type;
            if(dateInfo.view.type == "timeGridWeek"){
                weeks = dateInfo;
            }
            else{
                month = dateInfo;
            }
            const checkBoxs = document.querySelectorAll(".checkAgenda");
                checkBoxs.forEach((el)=> {
                    if(el.checked){
                        fetchEvent(el,this)
                    }})
        },
        eventSources: function(calendar){
            return [
                async (info, success, fail) => {
                    let events = []
                    if(view == "timeGridWeek"){
                        for (agenda in agendas) {
                            if (agendas[agenda].visible) {
                                events = [...events, ...agendas[agenda].event]
                            }
                        }
                    }else{
                        for (agenda in agendasMonth) {
                            if (agendasMonth[agenda].visible) {
                                events = [...events, ...agendasMonth[agenda].event]
                            }
                        }
                    }
                    return events;
                }
            ]
        }(this) ,

        allDaySlot: false,
        height:"100%",
        aspectRatio:3.0,
        nowIndicator: true,
        
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
            if(mouseInfo.event.id !== "null"){
                let eventRect = mouseInfo.el.getBoundingClientRect();
                let size = { width: mouseInfo.el.offsetWidth, height: mouseInfo.el.offsetHeight }
                showTooltip(eventRect, mouseInfo.event, size);
            }
            
        },
        eventMouseLeave: (mouseLeaveInfo) => {
            const popup = document.querySelector("#event-tooltip") 
            popup && popup.remove()
        },
        eventClick: (info) => {
            if (info.view.type === "timeGridWeek" && agendas[info.event._def.extendedProps.agendaId].permission!=="read"){
           
                drawPopUpRdv(rdv, info, false, calendar)
            }
           /* window.location.href = `${info.event.extendedProps.link}`;*/
        },


        /** DRAG DROP ET Pop-up **/

        dateClick: (info) => {
           
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

        // Selection settings
        unselectAuto: true,
        unselectCancel: '#popup-rdv', // Don't unselect when clicking popup
        selectOverlap: false, // Don't allow selection where events exist
        selectMinDistance: 10, // Minimum drag distance

        // Snap settings
        snapDuration: '00:15:00', // Snap to 15-minute intervals
        dragScroll: true,

        eventDragStart: function(info) {
            
            info.el.style.opacity = '0.5';
            if(popupActivated && info.event.id !=="null"){
                rdv.realEvent.remove()
                popupActivated = false;
                togglePopUp()
            }
        },
        eventDrop: async function(info) {
            info.el.style.opacity = '1';
         
            const event = info.event;
           
            const newStart = event.start;
            const newEnd = event.end;
          
            const rdv = {
              name:event.title, 
              realEvent:event,
              id:info.event.id,
              dateDebut:newStart,
              dateFin:newEnd,
              backgroundColor:info.event.backgroundColor,
              agendaId:event.extendedProps.agendaId,
              recurrences:{},
              rappel:info.event.extendedProps.rappel,
              recId:null
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
        select:function(info){
            if (info.view.type === "timeGridWeek") {
                drawPopUpRdv(rdv, info, true, calendar)

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
                    backgroundColor:event.backgroundColor,
                    realEvent:event,
                    id:event.id,
                    dateDebut:newStart,
                    dateFin:newEnd,
                    rappel:event.extendedProps.rappel,
                    agendaId:event.extendedProps.agendaId,
                    description:event.extendedProps.description,
                    recId:null,
                    recurrences:event.extendedProps.recurrences,
                    priorite:event.extendedProps.priorite,
                  }
                  updateRdvEvent(rdv)
                  fetchModif(rdv)
            }
            
            
            
            
        }

    });

    initPopUpRdv(calendar,refetch,fetchModif)
    const sideBar = document.querySelector(".sideBar");
    calendar.render();
    const menu = document.querySelector(".menu");
    menu.addEventListener("click", () => {
        sideBar.classList.toggle("sideBar-open");
        setTimeout(() => {
            calendar.updateSize();
        }, 500)
    })
    

    
   
    selectAllButton.addEventListener("click",(e)=>{
      const checkBoxs = document.querySelectorAll(".checkAgenda");
      checkBoxs.forEach(checkBox=>{
        checkBox.checked = true
        saveAgenda(checkBox)
        fetchEvent(checkBox,calendar)
      })
    })
    unSelectAllbutton.addEventListener("click",(e)=>{
      const checkBoxs = document.querySelectorAll(".checkAgenda");
      checkBoxs.forEach(checkBox=>{
        checkBox.checked = false
        agendas[checkBox.dataset.id].visible = false;
        unSaveAgenda(checkBox,calendar)
      })
      calendar.refetchEvents()
    })
    dateSelector.addEventListener("change",(e)=>{
      calendar.gotoDate(e.target.value)
     })
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

            rdv.agendaId = agenda._id;
            });

            agendaDropdown.appendChild(option);
        });
    }

 async function showDropdown(e){
    e.preventDefault()
    agendaDropdown.classList.toggle('show');
    await loadAgendas();
 }


// fonction d'initalisation d'un rdv selon la création ou modifiation d'un agenda 
function drawPopUpRdv(rdv2, info, click, calendar) {
    if (!popupActivated) {
        popupActivated = true
        let eventStart
        let eventEnd
        if (click) { 

            agendaButton.addEventListener('click', showDropdown);
            eventStart = info.date || info.start;
            eventStart.setMinutes(0, 0, 0);
            eventEnd = info.end || new Date(eventStart.getTime() + 3600000);
           rdv = {
            name:"",
            backgroundColor:"#3788d8",
            realEvent:null,
            id:"null",
            dateDebut:eventStart,
            dateFin:eventEnd,
            rappel:0,
            agendaId:null,
            description:"",
            recId:null,
            recurrences:{},
            priorite:"Moyenne",
          }
        const newEvent = {
                id:"null",
                title: '',
                start: eventStart,
                end: eventEnd,
                backgroundColor:"#3788d8",
                editable: true,
                extendedProps:{
                    agendaId:null,
                    recId:null,
                    rappel:0,
                    priorite:"Moyenne",
                    recurrences:{}
                },
                duration:eventEnd-eventStart
            };
            
            rdv.realEvent = calendar.addEvent(newEvent)
            rdv.name = newEvent.title;
            rdv.dateDebut = newEvent.start;
            rdv.dateFin = newEvent.end;
            rdv.backgroundColor = newEvent.backgroundColor;
            
        } else {      
            agendaButton.removeEventListener('click', showDropdown);
            agendaButton.addEventListener('click', (e)=>{
                e.preventDefault();
            });
            rdv = {
                name:info.event.title,
                backgroundColor:info.event.backgroundColor,
                realEvent:info.event,
                id:info.event.id,
                dateDebut:info.event.start,
                dateFin:info.event.end,
                rappel:info.event.extendedProps.rappel,
                agendaId:info.event.extendedProps.agendaId,
                description:info.event.extendedProps.description,
                recId:null,
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


const toggleBtn = document.querySelector(".description-header");
const menuIcon = document.querySelector('.menu-icon');
const closeIcon = document.querySelector('.close-icon');
const textareaContainer = document.getElementById('textareaContainer');
const labelText = document.getElementById('labelText');
const textarea = document.querySelector(".description-textarea")
const toggleDescription = ()=>{
    const isOpen = textareaContainer.classList.toggle('open');
    menuIcon.style.display = isOpen ? 'none' : 'block';
    closeIcon.style.display = isOpen ? 'block' : 'none';
    labelText.textContent = isOpen ? 'Description' : 'Description';
}

function updatePopUp(rdv, newEvent) {

    document.querySelector("#namerdv").value = rdv.name
    if(rdv.description){
        textarea.value = rdv.description || ""
        toggleDescription()
    }
    agendaButton.querySelector('.agenda-name').innerText = `Sélectionner un agenda`;
    Array.from(document.querySelectorAll("#priorite option")).forEach(e=>e.selected = e.value === rdv.priorite)
    allAgenda.forEach(agenda=>{
        if(agenda._id === rdv.agendaId){
            agendaButton.querySelector('.agenda-name').innerText = `${agenda.name}`;
        }
    })
    Array.from(document.querySelectorAll("#rappel option")).forEach(e=>{if(+e.value === rdv.rappel){e.selected=true}})
    document.querySelector(".selected-color").style.backgroundColor = rdv.backgroundColor;
    document.querySelectorAll('.color-dot').forEach(dot => {
        const [r,g,b] =hexToRgb(rdv.backgroundColor)
        dot.innerHTML = dot.style.backgroundColor === `rgb(${r}, ${g}, ${b})` ? '<span class="checkmark">✓</span>' : '';
    });
    document.querySelector('#date').value = rdv.dateDebut.toLocaleString('en-CA').split(',')[0];
    document.querySelector('#startrdvtime').value = rdv.dateDebut.toTimeString().slice(0, 5);
    document.querySelector('#endrdvtime').value = rdv.dateFin.toTimeString().slice(0, 5);

}
function initPopUpRdv(calendar,refetch,fetchModif) {

    const container = document.querySelector('.infoDate');
    const pickers = container.querySelectorAll('.time-picker');

    pickers.forEach(picker => {
        const input = picker.querySelector('.time-input');
        const dropdown = picker.querySelector('.time-dropdown');
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 5) {
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


    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDescription()
    });

    document.querySelector(".closer").addEventListener('click', function(event) {
        if(rdv.realEvent.id === "null"){
            rdv.realEvent.remove();
        }
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
                const [r,g,b] =hexToRgb(selectedColor)
                dot.innerHTML = dot.style.backgroundColor === `rgb(${r}, ${g}, ${b})` ? '<span class="checkmark">✓</span>' : '';
            });

            colorDropdown.classList.remove('show');
            rdv.backgroundColor = selectedColor
            updateRdvEvent(rdv)

        });

        colorDropdown.appendChild(option);
    });
    const option = document.createElement('div');
    option.className = 'color-option';
    option.innerHTML = `<input type="color">`
    colorDropdown.appendChild(option); 
    
  
    document.querySelector(".color-option input").addEventListener("input", function(e) {
        selectedColor = e.target.value
        
        selectedColorDot.style.backgroundColor = selectedColor;

        document.querySelectorAll('.color-dot').forEach(dot => {
            const [r,g,b] =hexToRgb(selectedColor)
                dot.innerHTML = dot.style.backgroundColor === `rgb(${r}, ${g}, ${b})` ? '<span class="checkmark">✓</span>' : '';
        });
        rdv.backgroundColor = selectedColor
        updateRdvEvent(rdv)
        
    }, false); 

    colorButton.addEventListener('click', (e) => {
        e.preventDefault()
        colorDropdown.classList.toggle('show');
    });


    
    document.querySelector("#date").addEventListener('change', (e) => {
        let t = rdv.dateDebut
        let t2 = rdv.dateFin
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

    document.querySelector("#rappel").addEventListener('change', (e) => {
        rdv.rappel = +(e.target.value)
        updateRdvEvent(rdv)
    })

    document.querySelector("#priorite").addEventListener('change', (e) => {
        rdv.priorite = e.target.value
        updateRdvEvent(rdv)
    })
    textarea.addEventListener("input",(e)=>{
        rdv.description = e.target.value
        
        updateRdvEvent(rdv)
    })
    document.querySelector("#preset-select").addEventListener("change",async (e)=>{
        const response = await fetch(`/api/presets/${e.target.value}`);
        const presetData = await response.json();
        rdv.name=presetData.eventName || ""
        rdv.backgroundColor = presetData.color || "#3788d8";
        rdv.description = presetData.description || "";
        rdv.priorite = presetData.priority || "Moyenne";
        rdv.rappel = +presetData.reminder || 0;
        if(presetData.startHour){
            let dateDebut = new Date();
            let [heures,minutes] = presetData.startHour.split(":");
            dateDebut.setHours(heures);
            dateDebut.setMinutes(minutes);
            rdv.dateDebut = dateDebut;
            if(presetData.duration){
                let dateFin = new Date(dateDebut);
                dateFin.setMinutes(dateFin.getMinutes() + presetData.duration);
                rdv.dateFin = dateFin;
            }
        }
        updateRdvEvent(rdv)
        updatePopUp(rdv)
    })
    document.querySelector("#rendezvous-form").addEventListener('submit', async(e) => {
       
        e.preventDefault()
     
        if(rdv.agendaId){
            document.querySelector("#rendezvous-form").classList.toggle('hide');
            const checkBoxs = Array.from(document.querySelectorAll(".checkAgenda"))
                    checkBoxs.forEach(e=>{
                        if(e.dataset.id === rdv.agendaId && !e.checked){
                            e.checked = true;
                            refetch(e,calendar)
                    }})   
           
            
            if(rdv.id !== "null"){
                
                updateRdvEvent(rdv);
                updatePopUp(rdv)
               
                fetchModif(rdv);
                calendar.refetchEvents();
            }
            else{
                 //comme on utilise index si on a aucun rendez-vous dans l'agenda 
            if(!agendas[rdv.agendaId]){
                agendas[rdv.agendaId]={event:[],visible:true};
            }
            let index = agendas[rdv.agendaId].event.indexOf(el=>el.id===rdv.id)
            if(index!=-1){
                agenda[rdv.agendaId].splice(index, 1)
            }
            let event = [...agendas[rdv.agendaId]?.event,rdv.realEvent]
            agendas[rdv.agendaId] = { event: event, visible: true }
                const fetchOptions = {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                            },
                    credentials: 'include',
                    body: JSON.stringify(rdv),
                }
                fetch(`/rendezvous`,fetchOptions).then(res=>res.json()).then(data=>{
                    togglePopUp();
                    //check la checkbox associé
                    rdv.realEvent.setProp('title', data.rdv.name)
                    //rdv.realEvent.setProp('backgroundColor', data.rdv.backgroundColor)
                    rdv.realEvent.setStart(data.rdv.dateDebut)
                    rdv.realEvent.setEnd(data.rdv.dateFin)
                    rdv.realEvent.setProp('id',data.rdv.id)
                    rdv.realEvent.setExtendedProp("agendaId",data.rdv.agendaId._id)
                   textarea.value = ""
                   document.querySelector("#namerdv").value = ""
                    
                })
            }
        }
        
        
    })
}

// link realEvent on rdv Model
function updateRdvEvent(rdv) {
   
    rdv.realEvent.setProp('title', rdv.name)
    rdv.realEvent.setProp('backgroundColor', rdv.backgroundColor)
    rdv.realEvent.setStart(rdv.dateDebut)
    rdv.realEvent.setEnd(rdv.dateFin)
    rdv.realEvent.setExtendedProp('agendaId',rdv.agendaId)
    rdv.realEvent.setExtendedProp("recId",rdv.recId)
    rdv.realEvent.setExtendedProp("rappel",rdv.rappel)
    rdv.realEvent.setExtendedProp("priorite",rdv.priorite)
    rdv.realEvent.setExtendedProp("description",rdv.description)
    
}

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');

    // Sélection de la barre d'outils pour ajuster son positionnement
    const toolbar = document.querySelector('.fc-header-toolbar');
    const menuWrapper = document.querySelector('.menu-wrapper');

    if (toolbar && menuWrapper) {
        // Ajoute un style pour ajuster la marge gauche de la barre d'outils
        toolbar.style.marginLeft = '50px';
    }
});


  