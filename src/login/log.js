const express = require('express');
const app = express();
const session = require('express-session');
const { connectToDatabase, sql } = require('../config/db'); // Importar conexión desde db.js
const registroRouter = require('../registro/reg'); // Importar router de registro
const cors = require('cors');
const path = require('path');
const port = 3001;

// Configuración de CORS y JSON
app.use(cors());         // Permitir CORS
app.use(express.json());
const HTML_DIR = path.join(__dirname, '/public/')
app.use(express.static(HTML_DIR))
app.use(express.static('js'));
// Conectar a la base de datos
connectToDatabase();

// Configuración de la sesión
app.use(session({
  secret: 'mi_clave_secreta',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Rutas
app.use('/registro', registroRouter);
app.post('/login', async (req, res) => {
  console.log('Datos recibidos en /login:', req.body); // <-- Depuración
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios' });
    }

    // Consulta a la base de datos
    const query = 'SELECT * FROM usuario WHERE usuario = @username AND contraseña = @password';
    const request = new sql.Request();
    request.input('username', sql.VarChar, username);
    request.input('password', sql.VarChar, password);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado o contraseña incorrecta' });
    }

    const usuario = result.recordset[0];
    req.session.usuario = { username: usuario.usuario, role: usuario.rol };

    if (usuario.rol === 'admin') {
      return res.json({ message: 'Sesión iniciada correctamente', redirect: '/admin' });
    } else if (usuario.rol === 'user') {
      return res.json({ message: 'Sesión iniciada correctamente', redirect: '/index' });
    } else {
      return res.status(403).json({ message: 'Rol de usuario no autorizado' });
    }
  } catch (err) {
    console.error('Error en el inicio de sesión:', err);
    return res.status(500).json({ message: 'Error en el inicio de sesión' });
  }
});

// Ruta para servir login.html desde la carpeta public
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../public', 'login.html'));
});

app.get('/admin', (req, res) => {
  if (!req.session.usuario || req.session.usuario.role!== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  res.sendFile(path.join(__dirname, '../../public', 'admin.html'));
});
// Ruta para el archivo de index (para usuarios normales)
app.get('/index', (req, res) => {
  if (!req.session.usuario || req.session.usuario.role !== 'user') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  // Servir la página de index (usuario regular)
  res.sendFile(path.join(__dirname, '../../public', 'index.html'));

// Ruta para servir admin.html desde la carpeta public
  res.sendFile(path.join(__dirname, '../../public', 'admin.html'));
});

//ruta para la pagina registro
app.get('/registro.html', (req, res) => {
  res.sendFile(__dirname + '/public/registro.html');
});
// Ruta para cerrar la sesión
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.status(200).json({ message: 'Sesión cerrada correctamente' });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});