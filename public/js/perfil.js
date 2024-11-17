document.addEventListener('DOMContentLoaded', async () => {
    // Obtener el ID del usuario del almacenamiento local
    const userId = localStorage.getItem('userId');

    if (!userId) {
        console.error('Usuario no autenticado');
        window.location.href = '/login'; // Redirigir al login si no hay usuario
        return;
    }

    try {
        const response = await fetch(`/perfil/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const userData = await response.json();

            // Llenar los campos del formulario con los datos del usuario
            document.getElementById('nombre').value = userData.nombre || '';
            document.getElementById('apellido').value = userData.apellido || '';
            document.getElementById('rut').value = `${userData.rut || ''}-${userData.dv_rut || ''}`;
            document.getElementById('usuario').value = userData.usuario || '';
            document.getElementById('correo').value = userData.correo || '';
            document.getElementById('rol').value = userData.rol || '';
        } else {
            console.error('Error al obtener los datos del usuario');
            if (response.status === 401) {
                // Redirigir al login en caso de error de autorización
                localStorage.removeItem('userId');
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
});

// Función para cerrar sesión (opcional)
function cerrarSesion() {
    localStorage.removeItem('userId');
    window.location.href = '/login';
}
