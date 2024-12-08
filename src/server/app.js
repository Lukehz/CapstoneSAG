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
const { getUsuarioById } = require('./controllers/AdminControllers/usuarioController'); // Ajusta la ruta si es necesario
//Rutas nicol
const parcelasRoutes = require('./Routes/parcelasRoutes');
const quarantineRoutes = require('./Routes/quarantineRoutes');
//Rutas perfil
const perfilRoutes = require('./Routes/AdminRoutes/perfilRoutes');

// Rutas de predicción
const prediccionRoutes = require('./Routes/prediccionRoutes'); // Nueva ruta de predicción

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

// Middleware para servir archivos estáticos (incluyendo los resultados de predicción)
app.use('/static', express.static(path.join(__dirname, 'public/static'))); // Nueva configuración para servir archivos estáticos de resultados

// Rutas protegidas (CRUD dinámico)
app.get('/crud', verificarAutenticacion('Admin'), (req, res) => {
  // Extrae el parámetro 'table' y asigna 'parcelacion' como valor por defecto si no existe
  const table = req.query.table || 'parcelacion';

  // Renderizar la vista del CRUD
  res.render('crud', {
      title: `Gestión de ${table}`,
      usuario: req.session.usuario // Pasar datos del usuario para personalizar la vista
  });
});

// Redirigir la ruta raíz al login
app.get('/', (req, res) => {
    res.redirect('/login'); // Redirige a la página de login
});

app.get('/index', verificarAutenticacion(['Admin', 'User']), (req, res) => {
  res.render('index', {
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
      const user = await getUsuarioById(userId);

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

// Página de predicciones
app.get('/prediccion', (req, res) => {
    res.render('prediccion', { title: 'Predicción de Imágenes', usuario: req.session.usuario });
});

const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');

// Ajuste de `multer` para mantener la extensión del archivo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/prediccion', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha cargado ninguna imagen.');
    }

    // Verificar la información del archivo subido
    console.log('Archivo subido:', req.file);

    const rutaImagen = path.resolve(req.file.path);

    // Verificar si el archivo existe antes de continuar
    if (!fs.existsSync(rutaImagen)) {
        console.error(`Archivo no encontrado en la ruta: ${rutaImagen}`);
        return res.status(404).send('Archivo no encontrado.');
    }

    const comandoPython = `python3 src/server/scriptsPy/prediccionYOLO.py ${rutaImagen}`;

    // Ejecutar el script de Python para hacer la predicción
    exec(comandoPython, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error durante la ejecución: ${stderr}`);
            return res.status(500).send('Error durante la predicción.');
        }

        try {
            const resultados = JSON.parse(stdout);
            if (resultados.error) {
                // Si hay un error en la predicción, muestra el error
                return res.status(500).send(`Error en la predicción: ${resultados.error}`);
            }
            

            // Renderizar la vista de resultados con la imagen inferida
            res.render('prediccionResultados', { 
                title: 'Resultado de la Predicción', 
                rutaImagenInferida: resultados.ruta_salida 
            });
        } catch (parseError) {
            console.error('Error al parsear la salida JSON:', parseError);
            return res.status(500).send('Error al procesar los resultados de la predicción.');
        }
    });
});

// Asegurarte de tener esto en tu app.js para que los archivos de 'uploads/' sean accesibles.
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
// Añadir rutas de predicción
app.use('/prediccion', prediccionRoutes); // Nueva ruta para manejar predicciones

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
