document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3001/usuario') // Revisa que la URL esté correcta y el servidor esté corriendo
        .then(response => response.json())
        .then(data => {
            const tablaUsuarios = document.getElementById('tablaUsuario').getElementsByTagName('tbody')[0];
            
            // Limpiar la tabla antes de agregar nuevos datos
            tablaUsuarios.innerHTML = '';
            
            data.forEach(usuario => {
                const fila = tablaUsuarios.insertRow();
                
                // Insertar celdas
                const celdaCorreo = fila.insertCell(0);
                celdaCorreo.textContent = usuario.correo;

                const celdaUsuario = fila.insertCell(1);
                celdaUsuario.textContent = usuario.usuario;

                const celdaRut = fila.insertCell(2);
                celdaRut.textContent = usuario.rut;

                const celdaDvRut = fila.insertCell(3);
                celdaDvRut.textContent = usuario.dv_rut;

                const celdaNombre = fila.insertCell(4);
                celdaNombre.textContent = usuario.nombre;

                const celdaApellido = fila.insertCell(5);
                celdaApellido.textContent = usuario.apellido;

                const celdaRol = fila.insertCell(6);
                celdaRol.textContent = usuario.rol;

                // Celda de acciones (editar y eliminar)
                const celdaAcciones = fila.insertCell(7);
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
    // Redirigir a la página de edición con el nombre de usuario en los parámetros
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

app.delete('/usuario/:rut', async (req, res) => {
    const { rut } = req.params;
    
    try {
      const query = `DELETE FROM usuario WHERE rut = @rut`;
      const request = new sql.Request();
      request.input('rut', sql.Int, rut);
      
      await request.query(query);
      res.status(200).json({ success: true, message: 'Usuario eliminado con éxito' });
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      res.status(500).json({ success: false, message: 'Error al eliminar usuario', error: err });
    }
  });

app.put('/usuario/:usuario', async (req, res) => {
    const { usuario } = req.params;
    const { correo, rut, dv_rut, nombre, apellido, rol } = req.body; // Datos a actualizar
  
    try {
      const query = `
        UPDATE usuario
        SET correo = @correo, rut = @rut, dv_rut = @dv_rut, nombre = @nombre, apellido = @apellido, rol = @rol
        WHERE usuario = @usuario
      `;
  
      const request = new sql.Request();
      request.input('correo', sql.VarChar, correo);          
      request.input('rut', sql.Int, rut);                   
      request.input('dv_rut', sql.Char, dv_rut);             
      request.input('nombre', sql.VarChar, nombre);          
      request.input('apellido', sql.VarChar, apellido);      
      request.input('rol', sql.VarChar, rol);                
      request.input('usuario', sql.VarChar, usuario);        
  
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
    fetch(`http://localhost:3001/usuario/${usuario}`)
    .then(response => response.json())
    .then(data => {
        // Llenar el formulario con los datos actuales del usuario
        document.getElementById('correo').value = data.correo;
        document.getElementById('rut').value = data.rut;
        document.getElementById('dv_rut').value = data.dv_rut;
        document.getElementById('nombre').value = data.nombre;
        document.getElementById('apellido').value = data.apellido;
        document.getElementById('rol').value = data.rol;
    })
    .catch(error => console.error('Error al cargar los datos del usuario:', error));
    
    document.getElementById('formEditarUsuario').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario

        const correo = document.getElementById('correo').value;
        const rut = document.getElementById('rut').value;
        const dv_rut = document.getElementById('dv_rut').value;
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const rol = document.getElementById('rol').value;

        // Hacer una solicitud PUT al backend para actualizar el usuario
        fetch(`http://localhost:3001/usuario/${usuario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correo, rut, dv_rut, nombre, apellido, rol
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
    function editarUsuario(usuario) {
        window.location.href = `editarUsuario.html?usuario=${usuario}`;
    }
});