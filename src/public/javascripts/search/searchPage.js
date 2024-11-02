const searchInput = document.getElementById('searchInput');
const dateDebutInput = document.getElementById('dateDebut');
const dateFinInput = document.getElementById('dateFin');
const sortPriorityCheckbox = document.getElementById('sortPriority');
const sortPriorityOrder = document.getElementById('sortPriorityOrder');
const sortDurationCheckbox = document.getElementById('sortDuration');
const sortDurationOrder = document.getElementById('sortDurationOrder');
const includeDescriptionCheckbox = document.getElementById('includeDescription');
const durationRange = document.getElementById('durationRange');
const durationRangeValue = document.getElementById('durationRangeValue');
const rdvList = document.getElementById('rdvList');
const noResultsMessage = document.getElementById('noResultsMessage');
let debounceTimeout;



// Initialisation de la plage de durée
noUiSlider.create(durationRange, {
    start: [0, 241],
    connect: true,
    range: {
        'min': 0,
        'max': 241
    },
    tooltips: [false, false],
    format: {
        to: value => Math.round(value),
        from: value => Math.round(value)
    }
});

durationRange.noUiSlider.on('update', (values, handle) => {
    const [min, max] = values.map(Number);
    durationRangeValue.textContent = `${min} - ${max === 241 ? '∞' : max} minutes`;
});



let currentPage = 1;
let isLoading = false;
let hasMore = true;

// Fonction pour détecter quand on approche du bas de la page
function handleScroll() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const clientHeight = window.innerHeight || document.documentElement.clientHeight;

    // Si on est proche du bas de la page (200px avant la fin)
    if (scrollHeight - scrollTop - clientHeight < 200 && !isLoading && hasMore) {
        loadMoreRdvs();
    }
}



let errorTimeout;

function showError(message) {
    // Annuler le timer précédent s'il existe
    if (errorTimeout) {
        clearTimeout(errorTimeout);
    }

    const errorContainer = document.getElementById('errorContainer');
    const errorText = document.getElementById('errorText');
    
    // Si un message est déjà affiché, on reset l'animation
    if (errorContainer.style.display === 'block') {
        errorContainer.style.animation = 'none';
        // Force le reflow pour réinitialiser l'animation
        errorContainer.offsetHeight;
        errorContainer.style.animation = null;
    }
    
    errorText.textContent = message;
    errorContainer.style.display = 'block';
    
    // Définir le nouveau timer
    errorTimeout = setTimeout(hideError, 5000);
}

function hideError() {
    const errorContainer = document.getElementById('errorContainer');
    
    // Ajouter une animation de sortie
    errorContainer.style.animation = 'slideOut 0.3s ease-out forwards';
    
    // Cacher le conteneur une fois l'animation terminée
    setTimeout(() => {
        errorContainer.style.display = 'none';
        errorContainer.style.animation = null; // Reset l'animation
    }, 300);
    
    // Clear le timeout
    if (errorTimeout) {
        clearTimeout(errorTimeout);
        errorTimeout = null;
    }
}



function disableControls() {
    document.querySelector('.search-controls').classList.add('controls-disabled');
}

function enableControls() {
    document.querySelector('.search-controls').classList.remove('controls-disabled');
}



// Fonction pour charger plus de rendez-vous
async function loadMoreRdvs(resetPage = false) {
    if (isLoading || (!hasMore && !resetPage)) return;

    if (resetPage) {
        currentPage = 1;
        hasMore = true;
        // Ajouter une classe pour l'animation de sortie avant de vider la liste
        const existingItems = rdvList.querySelectorAll('.rdv-item');
        existingItems.forEach(item => {
            item.style.animation = 'fadeOut 0.3s ease forwards';
        });
        
        // Attendre la fin de l'animation avant de vider
        await new Promise(resolve => setTimeout(resolve, 300));
        rdvList.innerHTML = '';
    }

    isLoading = true;
    noResultsMessage.style.display = 'none';
    showLoader();
    disableControls();

    const searchTerm = searchInput.value;
    const dateDebut = dateDebutInput.value;
    const dateFin = dateFinInput.value;
    const includeDescription = includeDescriptionCheckbox.checked;
    const [durationMin, durationMax] = durationRange.noUiSlider.get().map(Number);

    const sortBy = [];
    if (sortPriorityCheckbox.checked) sortBy.push(`priority:${sortPriorityOrder.value}`);
    if (sortDurationCheckbox.checked) sortBy.push(`duration:${sortDurationOrder.value}`);

    const params = new URLSearchParams({
        term: searchTerm,
        includeDescription: includeDescription,
        page: currentPage,
        limit: 20
    });

    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    if (durationMin) params.append('durationMin', durationMin);
    if (durationMax < 241) params.append('durationMax', durationMax);
    if (sortBy.length > 0) params.append('sortBy', sortBy.join(','));

    try {
        const response = await fetch(`/api/search?${params.toString()}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }

        const data = await response.json();

        if (data.rdvs.length === 0 && currentPage === 1) {
            noResultsMessage.style.display = 'block';
        } else {
            noResultsMessage.style.display = 'none';
            appendRdvs(data.rdvs);
            hasMore = data.hasMore;
            if (hasMore) currentPage++;
        }
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        showError('Une erreur est survenue lors de la recherche.');
        
        // En cas d'erreur, on réinitialise hasMore pour permettre de réessayer
        if (resetPage) {
            hasMore = true;
        }
    } finally {
        isLoading = false;
        hideLoader();
        enableControls();
    }
}

// Fonction pour ajouter les rendez-vous à la liste
function appendRdvs(rdvs) {
    const fragment = document.createDocumentFragment();
    
    rdvs.forEach((rdv, index) => {
        const li = document.createElement('li');
        li.className = 'rdv-item';
        li.innerHTML = `
            <div class="rdv-header">
                <div class="rdv-name">${rdv.name}</div>
                <span class="rdv-priority priority-${rdv.priority}">
                    ${rdv.priority}
                </span>
            </div>
            <div class="rdv-info">
                Agenda: ${rdv.agendaName} |
                Durée: ${rdv.duration} minutes
            </div>
            <div class="rdv-tags">
                ${rdv.tags.map(tag =>
                    `<span class="tag">${tag}</span>`
                ).join('')}
            </div>
        `;
        
        // Réinitialiser l'animation si c'est un nouveau chargement
        if (currentPage === 1) {
            li.style.animationDelay = `${index * 0.1}s`;
        } else {
            // Pour le chargement infini, utiliser un délai basé sur la position dans la page
            const baseIndex = (currentPage - 1) * 20; // Supposant 20 éléments par page
            li.style.animationDelay = `${(baseIndex + index) * 0.1}s`;
        }
        
        fragment.appendChild(li);
    });

    rdvList.appendChild(fragment);
}

function updateSearch() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        loadMoreRdvs(true);
    }, 300);
}



// Ajout des éléments de loading
const loader = document.createElement('div');
loader.className = 'loader';
loader.style.display = 'none';
loader.innerHTML = '<div class="loader-spinner"></div>';
document.querySelector('.search-container').appendChild(loader);

function showLoader() {
    loader.style.display = 'block';
}

function hideLoader() {
    loader.style.display = 'none';
}



// Gestion des erreurs de validation des dates
dateDebutInput.addEventListener('change', function() {
    const dateDebut = new Date(this.value);
    const dateFin = new Date(dateFinInput.value);
    
    if (dateFin && dateDebut > dateFin) {
        showError('La date de début doit être antérieure à la date de fin');
        this.value = '';
    }
});

dateFinInput.addEventListener('change', function() {
    const dateDebut = new Date(dateDebutInput.value);
    const dateFin = new Date(this.value);
    
    if (dateDebut && dateDebut > dateFin) {
        showError('La date de fin doit être postérieure à la date de début');
        this.value = '';
    }
});



// Écouteurs d'événements
window.addEventListener('scroll', handleScroll);
// Gestionnaire d'événements pour les changements d'ordre de tri de la priorité
sortPriorityOrder.addEventListener('change', () => {
    if (sortPriorityCheckbox.checked) {
        updateSearch();
    }
});

// Gestionnaire d'événements pour les changements d'ordre de tri de la durée
sortDurationOrder.addEventListener('change', () => {
    if (sortDurationCheckbox.checked) {
        updateSearch();
    }
});

includeDescriptionCheckbox.addEventListener('change', () => {
    if (searchInput.value) {
        updateSearch();
    }
});

sortPriorityCheckbox.addEventListener('change', updateSearch);
sortDurationCheckbox.addEventListener('change', updateSearch);
searchInput.addEventListener('input', updateSearch);
dateDebutInput.addEventListener('change', updateSearch);
dateFinInput.addEventListener('change', updateSearch);
durationRange.noUiSlider.on('change', updateSearch);


// Focus sur la barre de recherche
searchInput.focus();

// Chargement initial
loadMoreRdvs(true);
