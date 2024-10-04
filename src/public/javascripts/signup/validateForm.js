function validateForm() {
  const nom = document.getElementById('nom').value;
  const prenom = document.getElementById('prenom').value;
  const email = document.getElementById('email').value;
  const pseudo = document.getElementById('pseudo').value;
  const password = document.getElementById('password').value;
  const passwordConf = document.getElementById('passwordConf').value;

  const passwordError = document.getElementById('passwordError');
  const passwordConfError = document.getElementById('passwordConfError');

  // Réinitialisation des messages d'erreur
  passwordError.textContent = '';
  passwordConfError.textContent = '';

  let isValid = true;

  if (password.length < 8) {
    passwordError.textContent = 'Le mot de passe doit contenir au moins 8 caractères';
    isValid = false;
  }
  
  if (password !== passwordConf) {
    passwordConfError.textContent = 'Les mots de passe ne correspondent pas';
    isValid = false;
  }
  
  // TODO : Ajouter des validations pour les autres champs

  return isValid;
}
