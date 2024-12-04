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
            afficherPopUp("Les mots de passe ne correspondent pas. Veuillez vérifier vos saisies.", false);
            return;
        }
        
        // Vérification de la longueur du mot de passe seulement si un mot de passe est fourni
        if (passwordValue && passwordValue.length < 8) {
            afficherPopUp("Le mot de passe doit comporter au moins 8 caractères.", false);
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
                    afficherPopUp("Profil ou Mot de passe mis à jour avec succès !", true);
                } else {
                    afficherPopUp((result.message || 'Profil mis à jour avec succès.'), true);
                }
                // Recharger la page pour refléter les nouvelles données
                //window.location.reload();
            } else {
                afficherPopUp(result.error || 'Une erreur est survenue lors de la mise à jour.', false);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            afficherPopUp('Erreur de connexion au serveur.', false);
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
            afficherPopUp('Erreur lors de la déconnexion',false);
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        afficherPopUp('Erreur de connexion au serveur.',false);
    }
});

function showAlert(message) {
    const afficherPopUpContainer = document.getElementById('custom-alert');
    const afficherPopUpMessage = document.getElementById('alert-message');
    
    // Afficher le message dans l'afficherPopUpe
    afficherPopUpMessage.textContent = message;
    
    // Afficher l'afficherPopUpe avec une animation
    afficherPopUpContainer.classList.add('show');
    afficherPopUpContainer.style.display = 'block';
    
    // Masquer l'afficherPopUpe après 3 secondes (3000 ms)
    setTimeout(() => {
        closeafficherPopUp();
    }, 3000);
}

// Fonction pour fermer l'afficherPopUpe manuellement (en cas de clic sur le bouton de fermeture)
function closeafficherPopUp() {
    const afficherPopUpContainer = document.getElementById('custom-alert');
    afficherPopUpContainer.classList.remove('show');
    afficherPopUpContainer.style.display = 'none';
}


});


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