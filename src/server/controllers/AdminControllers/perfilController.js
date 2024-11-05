const { sql, query } = require('../../config/db'); // Importa la funciónes pra consultas y sql para trabar con SQL Server

/************************   
*****PerfilController******
 *************************/
// Leer todos los ítems
// Función para obtener el perfil de un usuario
const getPerfil = async (req, res) => {
  const { id } = req.params; // Obtiene el ID del usuario desde los parámetros de la URL
  console.log("ID del usuario:", id);

  const sqlQuery = `
    SELECT nombre, apellido, usuario, correo, rut, dv_rut, rol 
    FROM usuario 
    WHERE id_usuario = @id
  `;

  try {
    // Ejecutar la consulta con el parámetro proporcionado
    const result = await query(sqlQuery, [
      { name: 'id', type: sql.Int, value: parseInt(id) } // Convertir el ID a entero antes de pasarlo a la consulta
  ]);
    // Verificar si se encontró algún ítem
    if (result.length > 0) {
      // Si se encontró, devolver el primer ítem en formato JSON
      res.json(result[0]);
  } else {
      res.status(404).json({ error: 'Ítem no encontrado' });
  }

  } catch (err) {
    console.error('Error al obtener los datos del usuario:', err);
    res.status(500).render('error', { message: 'Error en el servidor' });
  }
};

module.exports = {
  getPerfil
};

