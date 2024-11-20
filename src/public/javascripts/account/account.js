document.addEventListener('DOMContentLoaded', () => {
    const editButton = document.querySelector('.edit');
    const saveButton = document.querySelector('.sauvegarde');
    const cancelButton = document.querySelector('.annuler'); 
    const logoutButton = document.querySelector('.logout');
    
    const passwordInput = document.getElementById('password-input');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    const eyeIcon = document.getElementById('eye-icon');
    const eyeIconConfirm = document.getElementById('eye-icon-confirm');

    const fields = document.querySelectorAll('.info input');
    const confirmPasswordContainer = document.getElementById('confirm-password-container');
    
    
    const emailField = document.querySelector('input[name="email"]');

    
    localStorage.setItem('isEditing', 'false');
    let isEditing = localStorage.getItem('isEditing') === 'true';
    
    if (!isEditing) {
        fields.forEach(field => {
            field.setAttribute('disabled', true);
        });
        
        confirmPasswordContainer.style.display = 'none'; // Cacher le champ de confirmation de mot de passe
        logoutButton.style.display = 'block'; // Afficher le bouton de déconnexion
    }
    editButton.addEventListener('click', () => {
        if (!isEditing) {
            logoutButton.style.display = 'none';
            fields.forEach(field => {
                field.removeAttribute('disabled');
            });

            // Le champ email ne peut pas être modifié
            if (emailField) {
                emailField.setAttribute('readonly', true);  // Empêche la modification
                emailField.style.border = '2px solid #f56565'; // Définit la bordure rouge
                emailField.style.cursor = 'not-allowed'; 
            }
            
            confirmPasswordContainer.setAttribute('style', 'display: block !important;');
        

            if (passwordInput) {
                passwordInput.placeholder = 'Nouveau mot de passe (optionnel)';
            }

            if (confirmPasswordInput) {
                confirmPasswordInput.placeholder = 'Confirmer le mot de passe (optionnel)';
            }

            saveButton.style.display = 'inline-block';
            cancelButton.style.display = 'inline-block'; // Afficher le bouton Annuler
            editButton.style.display = 'none';

            eyeIcon.style.display = 'inline';
            eyeIconConfirm.style.display = 'inline';
            
            isEditing = true;
        }
    });

    saveButton.addEventListener('click', async () => {
        const passwordValue = passwordInput.value;
        const confirmPasswordValue = confirmPasswordInput.value;
    
        // Vérification de la correspondance des mots de passe seulement si les champs sont remplis
        if (passwordValue && passwordValue !== confirmPasswordValue) {
            alert("Les mots de passe ne correspondent pas. Veuillez vérifier vos saisies.");
            return;
        }
    
        // Vérification de la longueur du mot de passe seulement si un mot de passe est fourni
        if (passwordValue && passwordValue.length < 8) {
            alert("Le mot de passe doit comporter au moins 8 caractères.");
            return;
        }
    
        // Récupérer les valeurs des champs
        const nom = document.querySelector('input[name="lastname"]').value;
        const prenom = document.querySelector('input[name="firstname"]').value;
        const pseudo = document.querySelector('input[name="pseudo"]').value;
    
        // Si les champs mot de passe sont vides, ne pas envoyer le mot de passe au serveur
        const dataToSend = {
            nom,
            prenom,
            pseudo,
        };
    
        // Si un mot de passe est fourni, l'ajouter aux données à envoyer
        if (passwordValue) {
            dataToSend.password = passwordValue;
        }
    
        // Désactiver les champs après sauvegarde
        fields.forEach(field => {
            field.setAttribute('disabled', true);
        });
    
        // Réinitialiser l'affichage du champ email
        if (emailField) {
            emailField.setAttribute('style', 'display: block;');
        }
    
        confirmPasswordContainer.setAttribute('style', 'display: none !important;');
        passwordInput.placeholder = '*************';
    
        saveButton.style.display = 'none';
        cancelButton.style.display = 'none'; // Masquer le bouton Annuler
        editButton.style.display = 'inline-block';
        eyeIcon.style.display = 'none';
        eyeIconConfirm.style.display = 'none';
    
        logoutButton.style.display = "block";
    
        isEditing = false;
    
        // Envoyer les données au serveur
        try {
            const response = await fetch('/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });
    
            const result = await response.json();
    
            if (response.ok) {
                if (result.passwordUpdated) {
                    alert("Profil ou Mot de passe mis à jour avec succès !");
                } else {
                    alert(result.message || 'Profil mis à jour avec succès.');
                }
                // Recharger la page pour refléter les nouvelles données
                window.location.reload();
            } else {
                alert(result.error || 'Une erreur est survenue lors de la mise à jour.');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            alert('Erreur de connexion au serveur.');
        }
    });
    
    // Action au clic sur "Annuler"
    cancelButton.addEventListener('click', () => {
        // Annuler les modifications et revenir à l'état précédent
        fields.forEach(field => {
            field.setAttribute('disabled', true); // Désactiver les champs
        });

        // Masquer le champ de confirmation du mot de passe
        confirmPasswordContainer.setAttribute('style', 'display: none !important;');
        
        // Réinitialiser les placeholders
        if (passwordInput) {
            passwordInput.placeholder = '*************';
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.placeholder = '*************';
        }

        // Réafficher le champ email
        if (emailField) {
            emailField.setAttribute('style', 'display: block;');
        }

        // Masquer le bouton "Sauvegarder" et "Annuler"
        saveButton.style.display = 'none';
        cancelButton.style.display = 'none';

        // Afficher le bouton "Modifier"
        editButton.style.display = 'inline-block';

        // Masquer les icônes "œil"
        eyeIcon.style.display = 'none';
        eyeIconConfirm.style.display = 'none';

        // Afficher le bouton "Se déconnecter"
        logoutButton.style.display = "block";

        isEditing = false;
    });

    eyeIcon.style.setProperty('font-size', '25px', 'important');
    eyeIconConfirm.style.setProperty('font-size', '25px', 'important'); 
    // Bascule de l'affichage du mot de passe
    eyeIcon.addEventListener('click', () => {
        if (passwordInput) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                eyeIcon.textContent = '👁️';
               
            }
        }
    });

    // Bascule de l'affichage de la confirmation du mot de passe
    eyeIconConfirm.addEventListener('click', () => {
        if (confirmPasswordInput) {
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                eyeIconConfirm.textContent = '🙈';
            } else {
                confirmPasswordInput.type = 'password';
                eyeIconConfirm.textContent = '👁️';
                 
            }
        }
    });

    // Action au clic sur "Se déconnecter"
logoutButton.addEventListener('click', async () => {
    // Envoyer une requête pour déconnecter l'utilisateur
    try {
        const response = await fetch('/logout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            // Si la déconnexion est réussie, rediriger l'utilisateur
            window.location.href = '/'; // Vous pouvez rediriger vers la page de connexion ou la page d'accueil
        } else {
            alert('Erreur lors de la déconnexion');
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        alert('Erreur de connexion au serveur.');
    }
});

function showAlert(message) {
    const alertContainer = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('alert-message');
    
    // Afficher le message dans l'alerte
    alertMessage.textContent = message;
    
    // Afficher l'alerte avec une animation
    alertContainer.classList.add('show');
    alertContainer.style.display = 'block';
    
    // Masquer l'alerte après 3 secondes (3000 ms)
    setTimeout(() => {
        closeAlert();
    }, 3000);
}

// Fonction pour fermer l'alerte manuellement (en cas de clic sur le bouton de fermeture)
function closeAlert() {
    const alertContainer = document.getElementById('custom-alert');
    alertContainer.classList.remove('show');
    alertContainer.style.display = 'none';
}


});


