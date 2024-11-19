const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const expressLayouts = require('express-ejs-layouts')

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
const { verificarAutenticacion } = require('./Middlewares/authMiddleware');
const { GetUserId } = require('./controllers/AdminControllers/usuarioController'); // Ajusta la ruta si es necesario
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


app.use(expressLayouts)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);


// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas protegidas (CRUD dinámico)
app.get('/crud', verificarAutenticacion('Admin'), (req, res) => {
  // Extrae el parámetro 'table' y asigna 'parcelacion' como valor por defecto si no existe
  const table = req.query.table || 'parcelacion';

  // Aquí puedes agregar lógica adicional si es necesario para cambiar el valor de 'table'
  // dependiendo de otras condiciones de la aplicación.

  // Renderizar la vista del CRUD
  res.render('crud', {
      title: `Gestión de ${table}`,
      usuario: req.session.usuario // Pasar datos del usuario para personalizar la vista
  });
});

// Redirigir la ruta raíz al login
app.get('/', (req, res) => {1
    res.redirect('/login'); // Redirige a la página de login
});

app.get('/index', verificarAutenticacion(['Admin', 'User']), (req, res) => {
  res.render('index', {
      title: 'Mapa de Cuarentenas',
      script: '',
      usuario: req.session.usuario  // Pasar datos del usuario a la vista
  });
});

app.get('/dashboard', verificarAutenticacion('Admin'), (req, res) => {
  res.render('dashboard', {
      title: 'Mapa de Cuarentenas',
      script: '',
      usuario: req.session.usuario  // Pasar datos del usuario a la vista
  });
});

app.use((req, res, next) => {
  if (req.session.usuario) {
      res.locals.usuario = {
          id_usuario: req.session.usuario.userId, // Cambia 'userId' a 'id_usuario'
          nombre: req.session.usuario.username,  // Cambia 'username' a 'nombre'
          rol: req.session.usuario.role          // Cambia 'role' a 'rol'
      };
  } else {
      res.locals.usuario = null;
  }
  console.log('Middleware global: usuario en sesión:', res.locals.usuario);
  next();
});

app.get('/perfil/:userId', verificarAutenticacion(['Admin', 'User']), async (req, res) => {
  try {
      const { userId } = req.params;

      // Recupera los datos del usuario
      const user = await GetUserId(userId);

      if (!user) {
          return res.status(404).render('error', {
              title: 'Error',
              message: 'Usuario no encontrado',
          });
      }

      // Actualiza la sesión con los datos actualizados si es necesario
      req.session.usuario = {
          userId: user.id_usuario,
          username: user.nombre,
          role: user.rol
      };

      // Combina los datos de la sesión con los del usuario recuperado
      const usuarioCompleto = {
          ...req.session.usuario, // Información de la sesión
          ...user                 // Información del usuario desde la base de datos
      };

      // Renderiza la vista del perfil
      res.render('perfil', {
          title: 'Perfil de Usuario',
          usuario: usuarioCompleto // Pasa el usuario combinado a la vista
      });
  } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      res.status(500).render('error', {
          title: 'Error',
          message: 'Error interno del servidor',
      });
  }
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
