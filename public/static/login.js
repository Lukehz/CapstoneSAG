document.addEventListener('DOMContentLoaded', () => {
  console.log('Script de login cargado'); // Confirmar que el script se carga correctamente
  
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Hacer una solicitud POST con fetch para enviar las credenciales al backend
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })  // Serializar los datos como JSON
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Sesión iniciada correctamente') {
        // Redirigir según el rol del usuario
        window.location.href = data.redirect;
      } else {
        document.getElementById('mensajeError').innerText = data.message;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('mensajeError').innerText = 'Ocurrió un error al iniciar sesión.';
    });
  });
});
