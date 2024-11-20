// Fonction pour mettre en évidence un élément de partage
const highlightShareItem = (shareId) => {
    // Trouver l'élément de partage
    const shareItem = document.querySelector(`.share-item[data-id="${shareId}"]`);
    if (shareItem) {
        // Scroll jusqu'à l'élément
        shareItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ajouter la classe highlight pour l'animation
        shareItem.classList.add('highlight');
        
        // Retirer la classe après l'animation
        setTimeout(() => {
            shareItem.classList.remove('highlight');
        }, 2000);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const shareSection = document.querySelector('#ajouterPartage');
    const agendaId = shareSection.dataset.agendaId;
    
    const userForm = document.getElementById('userShareForm');
    const linkForm = document.getElementById('linkShareForm');
    const typeBtns = document.querySelectorAll('.share-type-btn');

    // Fonction pour calculer la date dans 'days' jours
    const getFutureDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    };

    // Définir la date par défaut (7 jours) au chargement
    const linkValidUntil = document.getElementById('linkValidUntil');
    if (linkValidUntil) {
        linkValidUntil.value = getFutureDate(7);

        // Gestionnaire pour les boutons de date rapide
        const quickDateBtns = document.querySelectorAll('.quick-date-btn');
        quickDateBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Retirer la sélection des autres boutons
                quickDateBtns.forEach(b => b.classList.remove('selected'));
                // Sélectionner ce bouton
                this.classList.add('selected');
                // Mettre à jour la date
                const days = parseInt(this.dataset.days);
                linkValidUntil.value = getFutureDate(days);
            });
        });

        // Quand l'utilisateur change manuellement la date
        linkValidUntil.addEventListener('change', function() {
            // Désélectionner tous les boutons rapides
            quickDateBtns.forEach(btn => btn.classList.remove('selected'));
            
            // Vérifier que la date n'est pas trop lointaine
            const maxDate = getFutureDate(90);
            if (this.value > maxDate) {
                showFloatingMessage('La durée de validité maximale est de 3 mois', 'error');
                this.value = maxDate;
            }
        });
    }


    // Fonction utilitaire pour créer un élément de partage
    function createShareElement(share, shareUrl = null) {
        const currentShares = document.querySelector('.current-shares');
    
        // Supprimer le message "Aucun partage actif" s'il existe
        const noSharesMessage = currentShares.querySelector('.no-shares');
        if (noSharesMessage) {
            noSharesMessage.remove();
        }
    
        // Chercher ou créer la catégorie appropriée
        let categoryId = share.shareType === 'link' ? 'link-shares' : 'user-shares';
        let shareCategory = document.getElementById(categoryId);
    
        // Si la catégorie n'existe pas, la créer
        if (!shareCategory) {
            shareCategory = document.createElement('div');
            shareCategory.className = 'share-category';
            shareCategory.id = categoryId;

            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'share-category-title';
            
            if (share.shareType === 'link') {
                categoryTitle.innerHTML = `
                    <i class="fas fa-link"></i>
                    Liens de partage actifs
                    <button class="delete-all-btn" onclick="deleteAllShares('link', event)">
                        <i class="fas fa-trash-alt"></i>
                        Tout supprimer
                    </button>
                `;
            } else {
                categoryTitle.innerHTML = `
                    <i class="fas fa-user-friends"></i>
                    Partages avec des utilisateurs
                    <button class="delete-all-btn" onclick="deleteAllShares('user', event)">
                        <i class="fas fa-trash-alt"></i>
                        Tout supprimer
                    </button>
                `;
            }

            const shareList = document.createElement('div');
            shareList.className = 'share-list';
            
            shareCategory.appendChild(categoryTitle);
            shareCategory.appendChild(shareList);

            // Insérer la nouvelle catégorie dans l'ordre souhaité (utilisateurs en premier)
            if (share.shareType === 'user') {
                currentShares.insertBefore(shareCategory, currentShares.firstChild);
            } else {
                currentShares.appendChild(shareCategory);
            }
        }
    
        // Créer l'élément de partage
        const shareItem = document.createElement('div');
        shareItem.className = 'share-item';
        shareItem.dataset.id = share._id;
    
        // Préparer les informations de validité
        const validityInfo = share.settings && (share.settings.validFrom || share.settings.validUntil) 
            ? `<div class="validity-info">
                <i class="fas fa-clock"></i>
                ${share.settings.validFrom ? `À partir du ${new Date(share.settings.validFrom).toLocaleDateString()}` : ''}
                ${share.settings.validFrom && share.settings.validUntil ? ' - ' : ''}
                ${share.settings.validUntil ? `Jusqu'au ${new Date(share.settings.validUntil).toLocaleDateString()}` : ''}
               </div>`
            : '';
    
        // Remplir le contenu selon le type de partage
        if (share.shareType === 'link') {
            shareItem.innerHTML = `
                <div class="share-info">
                    <span class="share-link">
                        <i class="fas fa-link"></i>
                        Lien de partage
                        <input type="text" class="link-input" value="${shareUrl}" readonly>
                        <button class="copy-link-btn" onclick="copyShareLink(this, event)">
                            <i class="fas fa-copy"></i>
                        </button>
                    </span>
                    <span class="permission-badge ${share.permission}">
                        ${share.permission}
                    </span>
                    ${validityInfo}
                </div>
                <div class="share-actions">
                    <button class="delete-share" onclick="deleteShare('${share._id}', event, 'link')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        } else {
            shareItem.innerHTML = `
                <div class="share-info">
                    <span class="user-info">
                        <i class="fas fa-user"></i>
                        <span class="user-pseudo">${share.sharedWith.pseudo}</span>
                        <span class="user-email">(${share.sharedWith.email})</span>
                    </span>
                    <span class="permission-badge ${share.permission}">
                        ${share.permission}
                    </span>
                    ${validityInfo}
                </div>
                <div class="share-actions">
                    <button class="edit-share" onclick="editShare('${share._id}', event)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-share" onclick="deleteShare('${share._id}', event, 'user')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
    
        // Ajouter l'élément à sa catégorie
        const shareList = shareCategory.querySelector('.share-list');
        shareList.insertBefore(shareItem, shareList.firstChild);
    }

    // Gestion du changement de type de partage
    typeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            typeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const type = this.dataset.type;
            if (type === 'user') {
                userForm.style.display = 'block';
                linkForm.style.display = 'none';
            } else {
                userForm.style.display = 'none';
                linkForm.style.display = 'block';
            }
        });
    });

    const resetDate = () => {
        const linkValidUntil = document.getElementById('linkValidUntil');
        linkValidUntil.value = getFutureDate(7);
        const sevenDayBtn = document.querySelector('.quick-date-btn[data-days="7"]');
        if (sevenDayBtn) {
            document.querySelectorAll('.quick-date-btn').forEach(btn => btn.classList.remove('selected'));
            sevenDayBtn.classList.add('selected');
        }
    };

    // Gestion du formulaire de partage par lien
    linkForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const validUntil = this.validUntil.value;
        if (!validUntil) {
            showFloatingMessage('Veuillez sélectionner une date d\'expiration', 'error');
            return;
        }
        
        const formData = {
            shareType: 'link',
            permission: this.permission.value,
            validUntil: this.validUntil.value || null
        };

        try {
            const response = await fetch(`/agendas/${agendaId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.exists) {
                showFloatingMessage(data.message, 'info');
                highlightShareItem(data.share._id);
                this.reset();
                resetDate();
                return;
            }

            if (!response.ok) {
                showFloatingMessage(data.error || 'Une erreur est survenue', 'error');
                return;
            }

            // Créer l'élément et le mettre en surbrillance
            createShareElement(data.share, data.shareUrl);
            showFloatingMessage('Lien de partage créé avec succès', 'info');
            highlightShareItem(data.share._id);
            
            this.reset();
            resetDate();

        } catch (error) {
            console.error('Erreur:', error);
            showFloatingMessage('Une erreur est survenue', 'error');
        }
    });

    // Gestion du formulaire de partage utilisateur
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            shareType: 'user',
            email: this.email.value,
            permission: this.permission.value,
            validFrom: this.validFrom.value || null,
            validUntil: this.validUntil.value || null
        };

        try {
            const response = await fetch(`/agendas/${agendaId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.exists) {
                showFloatingMessage(data.message, 'info');
                highlightShareItem(data.shareId);
                this.reset();
                return;
            }

            if (!response.ok) {
                showFloatingMessage(data.error || 'Une erreur est survenue', 'error');
                return;
            }

            // Créer l'élément et le mettre en surbrillance
            createShareElement(data);
            showFloatingMessage('Partage créé avec succès', 'info');
            highlightShareItem(data._id);
            
            this.reset();

        } catch (error) {
            console.error('Erreur:', error);
            showFloatingMessage('Une erreur est survenue', 'error');
        }
    });
});

// Fonction pour afficher un message flottant
const showFloatingMessage = (message, type = 'info') => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `floating-message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageDiv);

    // Supprimer le message après 5 secondes
    setTimeout(() => {
        messageDiv.style.animation = 'slideDown 0.5s ease reverse';
        setTimeout(() => messageDiv.remove(), 500);
    }, 5000);
};

async function deleteShare(shareId, event, shareType) {
    event.stopPropagation();
    const confirmMessage = shareType === 'link' ? 
        'Voulez-vous vraiment désactiver ce lien de partage ?' : 
        'Voulez-vous vraiment supprimer ce partage ?';

    if (!confirm(confirmMessage)) {
        return;
    }

    const shareSection = document.querySelector('#ajouterPartage');
    const agendaId = shareSection.dataset.agendaId;
    const currentShares = document.querySelector('.current-shares');

    try {
        const response = await fetch(`/agendas/${agendaId}/share/${shareId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            const shareItem = event.target.closest('.share-item');
            const shareCategory = shareItem.closest('.share-category');
            const shareList = shareCategory.querySelector('.share-list');
            
            // Supprimer l'élément de partage
            shareItem.remove();

            // Si la catégorie est vide, la supprimer
            if (shareList.children.length === 0) {
                shareCategory.remove();
            }

            // Vérifier s'il reste des partages dans une catégorie quelconque
            const remainingCategories = currentShares.querySelectorAll('.share-category');
            if (remainingCategories.length === 0) {
                console.log('Aucun partage actif');
                currentShares.innerHTML = '<p class="no-shares">Aucun partage actif</p>';
            }

            showFloatingMessage('Partage supprimé avec succès', 'info');
        } else {
            const data = await response.json();
            alert(data.error || 'Une erreur est survenue lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la suppression');
    }
}

async function deleteAllShares(shareType, event) {
    event.preventDefault();

    const confirmMessage = shareType === 'link' 
        ? 'Voulez-vous vraiment supprimer tous les liens de partage ?' 
        : 'Voulez-vous vraiment supprimer tous les partages avec les utilisateurs ?';

    if (!confirm(confirmMessage)) {
        return;
    }

    const shareSection = document.querySelector('#ajouterPartage');
    const agendaId = shareSection.dataset.agendaId;
    const currentShares = document.querySelector('.current-shares');

    try {
        const response = await fetch(`/agendas/${agendaId}/share/delete-all/${shareType}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.status === 204) {
            const category = document.getElementById(`${shareType}-shares`);
            if (category) {
                category.remove();
            }

            // Vérifier s'il reste des partages
            const remainingCategories = currentShares.querySelectorAll('.share-category');
            if (remainingCategories.length === 0) {
                currentShares.innerHTML = '<p class="no-shares">Aucun partage actif</p>';
            }

            showFloatingMessage(`Tous les ${shareType === 'link' ? 'liens de partage' : 'partages utilisateurs'} ont été supprimés`, 'info');
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Une erreur est survenue');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showFloatingMessage(error.message, 'error');
    }
}


async function editShare(shareId, event) {
    event.stopPropagation();
    const shareItem = event.target.closest('.share-item');
    const userInfo = shareItem.querySelector('.user-info').cloneNode(true);
    const currentPermission = shareItem.querySelector('.permission-badge').innerText.toLowerCase(); // conversion en minuscules pour matcher les valeurs de select
    const validityInfo = shareItem.querySelector('.validity-info');
    
    let currentValidFrom = null;
    let currentValidUntil = null;
    if (validityInfo) {
        const dateText = validityInfo.textContent;
        const fromMatch = dateText.match(/À partir du (\d{2}\/\d{2}\/\d{4})/);
        const untilMatch = dateText.match(/Jusqu'au (\d{2}\/\d{2}\/\d{4})/);
        
        if (fromMatch) {
            const [day, month, year] = fromMatch[1].split('/');
            currentValidFrom = `${year}-${month}-${day}`;
        }
        if (untilMatch) {
            const [day, month, year] = untilMatch[1].split('/');
            currentValidUntil = `${year}-${month}-${day}`;
        }
    }

    // Créer le formulaire d'édition
    const editForm = document.createElement('div');
    editForm.className = 'share-item-edit';
    editForm.innerHTML = `
        <div class="share-info">
            ${userInfo.outerHTML}
        </div>
        <form class="share-form edit-share-form">
            <div class="form-group">
                <label for="editPermission">Permissions :</label>
                <select id="editPermission" name="permission" required>
                    <option value="read" ${currentPermission === 'read' ? 'selected' : ''}>Lecture seule</option>
                    <option value="contribute" ${currentPermission === 'contribute' ? 'selected' : ''}>Contributeur</option>
                    <option value="admin" ${currentPermission === 'admin' ? 'selected' : ''}>Administrateur</option>
                </select>
            </div>
            <div class="form-group dates">
                <div class="date-input">
                    <label for="editValidFrom">Valide à partir du :</label>
                    <input type="date" 
                           id="editValidFrom" 
                           name="validFrom" 
                           value="${currentValidFrom || ''}"
                           min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="date-input">
                    <label for="editValidUntil">Jusqu'au :</label>
                    <input type="date" 
                           id="editValidUntil" 
                           name="validUntil" 
                           value="${currentValidUntil || ''}"
                           min="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-actions">
                <button type="submit" class="submit-button">Sauvegarder</button>
                <button type="button" class="cancel-button">Annuler</button>
            </div>
        </form>
    `;

    // Stocker le contenu original et remplacer par le formulaire
    const originalContent = shareItem.innerHTML;
    shareItem.innerHTML = '';
    shareItem.appendChild(editForm);

    // Gérer la soumission du formulaire
    const form = editForm.querySelector('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPermission = form.permission.value;
        const validFrom = form.validFrom.value;
        const validUntil = form.validUntil.value;

        // Confirmer si changement en administrateur
        if (newPermission === 'admin' && currentPermission !== 'admin') {
            if (!confirm('Voulez-vous vraiment donner les droits d\'administrateur à cet utilisateur ? Il pourra modifier et partager l\'agenda.')) {
                return;
            }
        }

        const agendaId = document.querySelector('#ajouterPartage').dataset.agendaId;
        
        try {
            const response = await fetch(`/agendas/${agendaId}/share/${shareId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    permission: newPermission,
                    validFrom,
                    validUntil
                })
            });

            if (response.ok) {
                const updatedShare = await response.json();
                
                // Restaurer la structure HTML originale avec les valeurs mises à jour
                shareItem.innerHTML = originalContent;

                // Mettre à jour le badge de permission
                const permissionBadge = shareItem.querySelector('.permission-badge');
                permissionBadge.className = `permission-badge ${updatedShare.permission}`;
                permissionBadge.textContent = updatedShare.permission;

                // Mettre à jour les informations de validité
                if (shareItem.querySelector('.validity-info')) {
                    shareItem.querySelector('.validity-info').remove();
                }
                
                if (validFrom || validUntil) {
                    const validityInfo = document.createElement('div');
                    validityInfo.className = 'validity-info';
                    validityInfo.innerHTML = `
                        <i class="fas fa-clock"></i>
                        ${validFrom ? `À partir du ${new Date(validFrom).toLocaleDateString()}` : ''}
                        ${validFrom && validUntil ? ' - ' : ''}
                        ${validUntil ? `Jusqu'au ${new Date(validUntil).toLocaleDateString()}` : ''}
                    `;
                    shareItem.querySelector('.share-info').appendChild(validityInfo);
                }

                // Mettre en évidence l'élément mis à jour
                highlightShareItem(shareId);
                
                showFloatingMessage('Partage mis à jour avec succès', 'info');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showFloatingMessage(error.message, 'error');
        }
    });

    // Gérer l'annulation
    editForm.querySelector('.cancel-button').addEventListener('click', () => {
        shareItem.innerHTML = originalContent;
    });
}

async function copyShareLink(button, event) {
    event.stopPropagation();
    const input = button.previousElementSibling;
    
    try {
        await navigator.clipboard.writeText(input.value);
        
        // Feedback visuel
        const icon = button.querySelector('i');
        const originalClass = icon.className;
        icon.className = 'fas fa-check';
        button.classList.add('copy-feedback');
        
        setTimeout(() => {
            icon.className = originalClass;
            button.classList.remove('copy-feedback');
        }, 2000);
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        alert('Impossible de copier le lien automatiquement. Veuillez le copier manuellement.');
    }
}
