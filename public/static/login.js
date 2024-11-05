document.addEventListener('DOMContentLoaded', () => {
  console.log('Script de login cargado');
  
  document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      fetch('/api/auth/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
      })
      .then(response => response.json())
      .then(data => {
          if (data.message === 'Sesión iniciada correctamente') {
              // Guardar el ID del usuario en localStorage
              localStorage.setItem('userId', data.userId);
              // Opcional: guardar también el rol si lo necesitas
              localStorage.setItem('userRole', data.rol);
              // Redirigir según el rol del usuario
              window.location.href = data.redirect;
          } else {
              document.getElementById('mensajeError').innerText = data.message;
          }
      })
      .catch(error => {
          console.error('Error:', error);
          document.getElementById('mensajeError').innerText = 'Ocurrió un error al iniciar sesión';
      });
  });
});
