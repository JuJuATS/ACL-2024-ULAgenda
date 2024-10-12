function validateForm() {
  const nomField = document.getElementById('nom');
  const prenomField = document.getElementById('prenom');
  const emailField = document.getElementById('email');
  const pseudoField = document.getElementById('pseudo');
  const passwordField = document.getElementById('password');
  const passwordConfField = document.getElementById('passwordConf');

  // Ajustements des valeurs des champs
  nomField.value = nomField.value.trim().toUpperCase();
  prenomField.value = prenomField.value.trim().split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join('-');
  emailField.value = emailField.value.trim().toLowerCase();
  pseudoField.value = pseudoField.value.trim();

  const nom = nomField.value;
  const prenom = prenomField.value;
  const email = emailField.value;
  const pseudo = pseudoField.value;
  const password = passwordField.value;
  const passwordConf = passwordConfField.value;

  const nomError = document.getElementById('nomError');
  const prenomError = document.getElementById('prenomError');
  const emailError = document.getElementById('emailError');
  const pseudoError = document.getElementById('pseudoError');
  const passwordError = document.getElementById('passwordError');
  const passwordConfError = document.getElementById('passwordConfError');

  // Réinitialisation des messages d'erreur
  nomError.textContent = '';
  prenomError.textContent = '';
  emailError.textContent = '';
  pseudoError.textContent = '';
  passwordError.textContent = '';
  passwordConfError.textContent = '';

  let isValid = true;

  // Validation du nom
  if (nom === '') {
    nomError.textContent = 'Le nom est requis';
    isValid = false;
  }

  // Validation du prénom
  if (prenom === '') {
    prenomError.textContent = 'Le prénom est requis';
    isValid = false;
  } else if (/\s/.test(prenom)) {
    prenomError.textContent = 'Le prénom ne doit pas contenir d\'espaces';
    isValid = false;
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    emailError.textContent = 'L\'adresse email n\'est pas valide';
    isValid = false;
  }

  // Validation du pseudo
  if (pseudo === '') {
    pseudoError.textContent = 'Le pseudo est requis';
    isValid = false;
  } else if (pseudo.length < 3) {
    pseudoError.textContent = 'Le pseudo doit contenir au moins 3 caractères';
    isValid = false;
  }

  // Validation du mot de passe
  if (password.length < 8) {
    passwordError.textContent = 'Le mot de passe doit contenir au moins 8 caractères';
    isValid = false;
  }

  // Validation de la confirmation du mot de passe
  if (password !== passwordConf) {
    passwordConfError.textContent = 'Les mots de passe ne correspondent pas';
    isValid = false;
  }

  return isValid;
}