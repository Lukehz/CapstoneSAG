const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Importar las rutas
const parcelacionRoutes = require('./Routes/AdminRoutes/parcelacionRoutes');
const cuarentenaRoutes = require('./Routes/AdminRoutes/cuarentenaRoutes');
const regionRoutes = require('./Routes/AdminRoutes/regionRoutes');
const provinciaRoutes = require('./Routes/AdminRoutes/provinciaRoutes');
const sectorRoutes = require('./Routes/AdminRoutes/sectorRoutes');
const faseRoutes = require('./Routes/AdminRoutes/faseRoutes');
const cultivoRoutes = require('./Routes/AdminRoutes/cultivoRoutes');
const usuarioRoutes = require('./Routes/AdminRoutes/usuarioRoutes');
const historialRoutes = require('./Routes/AdminRoutes/historialRoutes');
const authRoutes = require('./Routes/AdminRoutes/authRoutes'); // Importar rutas de autenticación
const crudRoutes = require('./Routes/AdminRoutes/crudRoutes'); // Asegúrate de requerir tus rutas de CRUD
const { verificarAutenticacion } = require('./Middlewares/authMiddleware');
//Rutas nicol
const parcelasRoutes = require('./Routes/parcelasRoutes');
const quarantineRoutes = require('./Routes/quarantineRoutes');
//Rutas perfil
const perfilRoutes = require('./Routes/AdminRoutes/perfilRoutes');

// Inicializar la aplicación Express
const app = express();

// Middleware
app.use(cors()); // Habilitar CORS
app.use(bodyParser.json()); // Parsear JSON
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Parsear URL-encoded

console.log('EN APP.JS');

const session = require('express-session');

// Configuración de la sesión
app.use(session({
    secret: 'mi_clave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a true si usas HTTPS
}));

// Servir archivos estáticos
  // Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../../public/static')));

app.use(express.static(path.join(__dirname, '../../public/crud')));
// En app.js
app.get('/crud', verificarAutenticacion('Admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/crud', 'crud.html'));
});

// Redirigir la ruta raíz al login
app.get('/', (req, res) => {
    res.redirect('/login'); // Redirige a la página de login
});

app.get('/Index', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'index.html'));
});

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../../public')));

// Ruta para servir login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'login.html'));
});

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});


// Rutas Crud
app.use('/api/parcelacion', parcelacionRoutes);
app.use('/api/cuarentena', cuarentenaRoutes);
app.use('/api/region', regionRoutes);
app.use('/api/provincia', provinciaRoutes);
app.use('/api/sector', sectorRoutes);
app.use('/api/fase', faseRoutes);
app.use('/api/cultivo', cultivoRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/auth', authRoutes);
//app.use('/api/crud', crudRoutes); // Aquí añades tus rutas de CRUD
// Exportar la aplicación para su uso en server.js

// Ruta para servir perfil.html
app.get('/perfil', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public','perfil.html'));
});

app.use('/perfil', perfilRoutes);

// Rutas Nicole
app.use('/api', parcelasRoutes);
app.use('/parcelas', parcelasRoutes);
app.use('/api', quarantineRoutes);
app.use('/quarantines', quarantineRoutes);

// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Ha ocurrido un error en el servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  };

// Manejo de ruta no encontrada (paraz cualquier ruta no especificada)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });
  
  // Usar el middleware de manejo de errores
  app.use(errorHandler);
  
  // Manejo de errores no capturados
  process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
    process.exit(1);
  });
  
module.exports = app;
