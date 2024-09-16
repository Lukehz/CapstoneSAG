const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const app = express();
const port = 3001;

// Configuración de CORS y JSON
app.use(cors());
app.use(express.json()); // Para analizar solicitudes JSON

// Configuración de la base de datos
const config = {
  user: 'Luc_hernandez_SQLLogin_1',
  password: 'nus1f946z7',
  server: 'ProyectoCapstone.mssql.somee.com',
  database: 'ProyectoCapstone',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Conectar a la base de datos
sql.connect(config)
  .then(() => console.log('Conexión a la base de datos exitosa'))
  .catch(err => console.error('Error al conectar a la base de datos:', err));

// Configuración de la sesión
app.use(session({
  secret: 'mi_clave_secreta',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Ruta para el login
app.post('/login', async (req, res) => {
  try {
    // Validar que los campos estén presentes
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios' });
    }

    const { username, password } = req.body;

    // Obtener el usuario solo por el nombre de usuario y contraseña
    const query = 'SELECT * FROM usuario WHERE usuario = @username AND contraseña = @password';
    const request = new sql.Request();
    request.input('username', sql.VarChar, username);
    request.input('password', sql.VarChar, password);

    // Ejecutar la consulta
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado o contraseña incorrecta' });
    }

    const usuario = result.recordset[0];

    // Establecer la sesión con el tipo de usuario (rol)
    req.session.usuario = { username: usuario.usuario, role: usuario.rol };

    // Redirigir según el rol
    if (usuario.rol === 'admin') {
      return res.status(200).json({ message: 'Sesión iniciada correctamente', redirect: "/registro" });
    } else {
      return res.status(200).json({ message: 'Sesión iniciada correctamente', redirect: "/index" });
    }
  } catch (err) {
    console.error('Error en el inicio de sesión:', err);
    res.status(500).json({ message: 'Error en el inicio de sesión', error: err });
  }
});

// Ruta protegida (acceso para todos los usuarios logueados)
app.get('/protected', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ message: 'Acceso denegado, sesión no iniciada' });
  }

  const role = req.session.usuario.role;
  res.status(200).json({ message: `Bienvenido, ${req.session.usuario.username}` });
});

// Ruta para el archivo de registro (solo para administradores)
app.get('/registro', (req, res) => {
  if (!req.session.usuario || req.session.usuario.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado, solo administradores' });
  }

  // Servir el archivo de registro para administradores
  res.sendFile(path.join(__dirname, '../../public', 'registro.html'));
});

app.post('/registro', async (req, res) => {
  if (!req.session.usuario || req.session.usuario.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado, solo administradores' });
  }

  try {
    const { nombre, apellido, rut, dv_rut, correo, usuario, contraseña, rol } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !apellido || !rut || !dv_rut || !correo || !usuario || !contraseña || !rol) {
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

// Ruta para el archivo de index (para usuarios normales)
app.get('/index', (req, res) => {
  if (!req.session.usuario || req.session.usuario.role !== 'user') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  // Servir el archivo index.html para usuarios normales
  res.sendFile(path.join(__dirname, '../../public', 'index.html'));
});

// Ruta para cerrar la sesión
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.status(200).json({ message: 'Sesión cerrada correctamente' });
});

// Ruta para servir login.html desde la carpeta public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public', 'login.html'));
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});