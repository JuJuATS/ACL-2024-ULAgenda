const agendas = []


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
function showTooltip(eventRect, event, size) {
  let tooltip = document.getElementById('event-tooltip') ||
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

  let calendarEl = document.getElementById('calendar');
  let calendar = new FullCalendar.Calendar(calendarEl, {
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
    dayHeaderFormat: { weekday: 'long',day:"numeric" },
    locale: 'fr',
    firstDay: 1,
    headerToolbar: {
      start: 'title',
      center: "timeGridWeek,dayGridMonth",
      end: 'today prev,next'
    },
    buttonText: {
      today: "Aujourd'hui",
      week: "semaine",
      month: "mois"
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
    eventClick: (eventClickInfo) => {
      window.location.href = `${eventClickInfo.event.extendedProps.link}`;
    }
  });

  calendar.render();
 
  const sideBar = document.querySelector(".sideBar");
  const menu = document.querySelector(".menu");
  menu.addEventListener("click", () => {
    sideBar.classList.toggle("sideBar-open");
    setTimeout(() => {
      calendar.updateSize();
    }, 500)
  })

  const checkBoxs = document.querySelectorAll(".listAgenda input");
  checkBoxs.forEach(checkBox => {
    checkBox.addEventListener("change", (el) => {
      refetch(el.target, calendar)
    })
    handleCheckBox(checkBox)
  });
console.log(selectAllButton)
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
 const dateSelector = document.querySelector("#dateSelector");
 dateSelector.value = new Date(Date.now()).toISOString().split("T")[0]
 dateSelector.addEventListener("change",(e)=>{
  calendar.gotoDate(e.target.value)
 })
});
