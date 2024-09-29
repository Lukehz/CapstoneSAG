// Obtener la lista de usuarios al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3001/usuario') // Ruta que devuelve todos los usuarios
       .then(response => response.json())
       .then(data => {
            const tablaUsuarios = document.getElementById('tablaUsuarios').getElementsByTagName('tbody')[0];
            
            data.forEach(usuario => {
                const fila = tablaUsuarios.insertRow();
                
                // Insertar celdas
                const celdaUsuario = fila.insertCell(0);
                celdaUsuario.textContent = usuario.correo;

                const celdaCorreo = fila.insertCell(1);
                celdaCorreo.textContent = usuario.usuario;

                const celdaRol = fila.insertCell(2);
                celdaRol.textContent = usuario.rut;

                const celdaNombre = fila.insertCell(3);
                celdaNombre.textContent = usuario.nombre;

                const celdaApellido = fila.insertCell(4);
                celdaApellido.textContent = usuario.apellido;

                const celdaAcciones = fila.insertCell(5);
                celdaAcciones.innerHTML = `
                    <button onclick="editarUsuario('${usuario.usuario}')">Editar</button>
                    <button onclick="eliminarUsuario('${usuario.rut}')">Eliminar</button>
                `;
            });
        })
       .catch(error => console.error('Error al cargar usuarios:', error));
});

// Función para editar usuario
function editarUsuario(usuario) {
    // Aquí puedes redirigir a una página de edición o manejar la edición en esta misma página
    // Redirigir a una página de edición (ejemplo)
    window.location.href = `editarUsuario.html?usuario=${usuario}`;
}

// Función para eliminar usuario
function eliminarUsuario(rut) {
    fetch(`http://localhost:3001/usuario/${rut}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Usuario eliminado con éxito');
            location.reload(); // Recargar la página para actualizar la lista
        } else {
            alert('Error al eliminar usuario');
        }
    })
    .catch(error => console.error('Error al eliminar usuario:', error));
}

// Ruta para actualizar un usuario por su nombre de usuario
app.put('/usuario/:usuario', async (req, res) => {
    const { usuario } = req.params;
    const { correo, rol } = req.body; // Los datos que se van a actualizar
  
    try {
      const query = `
        UPDATE usuario
        SET correo = @correo, usuario = @usuario, rut = @rut, dv_rut = @dv_rut, nombre = @nombre, apellido = @apellido, rol = @rol
        WHERE usuario = @usuario
      `;
  
      const request = new sql.Request();
      request.input('correo', sql.VarChar, correo);              // Correo
      request.input('usuario', sql.VarChar, usuario);            // Usuario
      request.input('rut', sql.Int, rut);                        // RUT (entero)
      request.input('dv_rut', sql.Char, dv_rut);                 // DV del RUT (carácter)
      request.input('nombre', sql.VarChar, nombre);              // Nombre
      request.input('apellido', sql.VarChar, apellido);          // Apellido
      request.input('rol', sql.VarChar, rol);                    // Rol
  
      await request.query(query);
      res.status(200).json({ message: 'Usuario actualizado con éxito' });
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      res.status(500).json({ message: 'Error al actualizar usuario', error: err });
    }
  });

  // Obtener el nombre de usuario de la URL
const urlParams = new URLSearchParams(window.location.search);
const usuario = urlParams.get('usuario');

// Cargar los detalles del usuario para editarlos
document.addEventListener('DOMContentLoaded', () => {
    // Aquí puedes cargar los datos actuales del usuario si es necesario

    document.getElementById('formEditarUsuario').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario

        const correo = document.getElementById('correo').value;
        const rol = document.getElementById('rol').value;

        // Hacer una solicitud PUT al backend para actualizar el usuario
        fetch(`http://localhost:3001/usuario/${usuario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo,
                rol
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Usuario actualizado con éxito');
                window.location.href = 'admin.html'; // Volver a la lista de usuarios
            } else {
                alert('Error al actualizar usuario');
            }
        })
        .catch(error => console.error('Error al actualizar usuario:', error));
    });
});
