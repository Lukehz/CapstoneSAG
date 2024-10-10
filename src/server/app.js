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

// Inicializar la aplicación Express
const app = express();

// Middleware
app.use(cors()); // Habilitar CORS
app.use(bodyParser.json()); // Parsear JSON
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
app.get('/crud', verificarAutenticacion('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/crud', 'crud.html'));
});

// Redirigir la ruta raíz al login
app.get('/', (req, res) => {
    res.redirect('/login'); // Redirige a la página de login
});

// Ruta para servir login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'login.html'));
});


// Usar las rutas
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



module.exports = app;
