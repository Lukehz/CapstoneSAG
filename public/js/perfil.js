document.addEventListener('DOMContentLoaded', async () => {
    // Obtener el ID del usuario del localStorage
    const userId = localStorage.getItem('userId');

    if (!userId) {
        console.error('Usuario no autenticado');
        window.location.href = '/login'; // Redirigir al login si no hay usuario
        return;
    }

    try {
        const response = await fetch(`/perfil/${userId}`);
        if (response.ok) {
            const userData = await response.json();

            // Llenar los campos con los datos del usuario
            document.getElementById('nombre').value = userData.nombre;
            document.getElementById('apellido').value = userData.apellido;
            document.getElementById('rut').value = userData.rut + '-' + userData.dv_rut;
            document.getElementById('usuario').value = userData.usuario;
            document.getElementById('correo').value = userData.correo;
            document.getElementById('rol').value = userData.rol;
        } else {
            console.error('Error al obtener datos del usuario');
            // Si hay un error de autorización, redirigir al login
            if (response.status === 401) {
                localStorage.removeItem('userId'); // Limpiar el ID almacenado
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
});

// Opcional: Añadir función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('userId');
    window.location.href = '/login';
}
