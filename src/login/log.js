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
    if (!req.body.username ||!req.body.password) {
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
    req.session.usuario = { username: usuario.nombre_usuario, role: usuario.rol };
    res.status(200).json({ message: 'Sesión iniciada correctamente', role: usuario.rol });
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
  res.status(200).json({ message: `Bienvenido, ${req.session.usuario.username}`, role });
});

// Ruta solo para administradores
app.get('/admin', (req, res) => {
  if (!req.session.usuario || req.session.usuario.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado, solo administradores' });
  }

  res.status(200).json({ message: 'Bienvenido, Administrador' });
});

// Ruta para cerrar la sesión
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.status(200).json({ message: 'Sesión cerrada correctamente' });
});

// Servir el archivo login.html desde la carpeta public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public', 'login.html'));
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});