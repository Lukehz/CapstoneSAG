const { sql, query } = require('../../config/db'); // Importa la funciónes pra consultas y sql para trabar con SQL Server

const login = async (req, res) => {
    console.log('Datos recibidos en /login:', req.body); // <-- Depuración
    try {
      const { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios' });
      }
  
      // Consulta a la base de datos
      const sqlQuery = 'SELECT * FROM usuario WHERE usuario = @username AND password = @password';

      // Ejecutar la consulta SQL con los parámetros correspondientes
      const result = await query(sqlQuery, [
        { name: 'username', type: sql.VarChar, value: username },
        { name: 'password', type: sql.VarChar, value: password }
    ]);
  
      if (result.length === 0) {
        return res.status(401).json({ message: 'Usuario no encontrado o contraseña incorrecta' });
      }
      const usuario = result[0];
      req.session.usuario = { username: usuario.usuario, role: usuario.rol };
  
      // Redirigir según el rol
      if (usuario.rol === 'admin') {
        return res.json({ message: 'Sesión iniciada correctamente', redirect: '/crud' });
      } else if (usuario.rol === 'user') {
        return res.json({ message: 'Sesión iniciada correctamente', redirect: '/index' });
      } else {
        return res.status(403).json({ message: 'Rol de usuario no autorizado' });
      }
    } catch (err) {
      console.error('Error en el inicio de sesión:', err);
      return res.status(500).json({ message: 'Error en el inicio de sesión' });
    }
  };

  // Ruta para cerrar la sesión
  const logout = (req, res) => {
    req.session.destroy();
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  };

  // Exportar los controladores
module.exports = {
    login,
    logout
};