const { connectToDatabase, sql } = require('../config/db');
// Ruta para obtener todos los usuarios
app.get('/usuario', async (req, res) => {
    try {
      const result = await sql.query('SELECT * FROM usuario');
      res.json(result.recordset); // Devuelve los usuarios como JSON
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
  });