const express = require('express');
const router = express.Router();
const { connectDB, sql, query } = require('../config/db'); // Importa la función de conexión y el módulo sql
const path = require('path');

// Ruta para el archivo de registro (solo para administradores)
router.get('/', (req, res) => {
  if (!req.session.usuario || req.session.usuario.role!== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado, solo administradores' });
  }

  // Servir el archivo de registro para administradores
  res.sendFile(path.join(__dirname, '../../public','registro.html'));
});
router.post('/', async (req, res) => {
  if (!req.session.usuario || req.session.usuario.role!== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado, solo administradores' });
  }

  try {
    const { nombre, apellido, rut, dv_rut, correo, usuario, contraseña, rol } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre ||!apellido ||!rut ||!dv_rut ||!correo ||!usuario ||!contraseña ||!rol) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    // Consulta SQL para insertar los datos en la tabla 'usuario'
    const query = `
      INSERT INTO usuario (correo, contraseña, usuario, rut, dv_rut, nombre, apellido, rol)
      VALUES (@correo, @contraseña, @usuario, @rut, @dv_rut, @nombre, @apellido, @rol)
    `;

    const request = new sql.Request();
    request.input('correo', sql.VarChar, correo);              // Correo
    request.input('contraseña', sql.VarChar, contraseña);      // Contraseña
    request.input('usuario', sql.VarChar, usuario);            // Usuario
    request.input('rut', sql.Int, rut);                        // RUT (entero)
    request.input('dv_rut', sql.Char, dv_rut);                 // DV del RUT (carácter)
    request.input('nombre', sql.VarChar, nombre);              // Nombre
    request.input('apellido', sql.VarChar, apellido);          // Apellido
    request.input('rol', sql.VarChar, rol);                    // Rol

    // Ejecutar la consulta SQL
    await request.query(query);

    // Enviar respuesta de éxito
    res.status(201).json({ success: true, message: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error('Error en el registro:', err);
    res.status(500).json({ success: false, message: 'Error al registrar el usuario', error: err });
  }
});

module.exports = router;