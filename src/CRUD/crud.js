// Importar las librerías necesarias
const express = require('express'); // Framework web para construir aplicaciones y APIs
const bodyParser = require('body-parser'); // Middleware para parsear cuerpos de solicitudes HTTP
const multer = require('multer'); // Middleware para manejar la subida de archivos
const path = require('path'); // Módulo para trabajar con rutas y directorios de archivos
const { connectDB, sql, query } = require('../config/db'); // Importa la función para conectar a la base de datos
// LO NUEVO LOGIN
const session = require('express-session');
const cors = require('cors'); // Asegúrate de requerir CORS

// Inicializar la aplicación Express
const app = express();

app.use(cors()); // Habilita CORS para todas las solicitudes
app.use(express.json());
/* DUDA
app.use(cors({
    origin: 'http://localhost:3001' // Permite solo solicitudes desde este origen
  }));
*/
// LO NUEVO LOGIN
// Configuración de la sesión
app.use(session({
    secret: 'mi_clave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
  // LO NUEVO LOGIN
  // Middleware para verificar la autenticación y el rol
  function verificarAutenticacion(role) {
    return (req, res, next) => {
      if (!req.session.usuario) {
        return res.status(401).json({ message: 'Acceso no autorizado' });
      }
      if (role && req.session.usuario.role !== role) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
      next();
    };
  }
//lo nuevo LOGIN
// Rutas
app.post('/login', async (req, res) => {
    console.log('Datos recibidos en /login:', req.body); // <-- Depuración
    try {
      const { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios' });
      }
  
      // Consulta a la base de datos
      const query = 'SELECT * FROM usuario WHERE usuario = @username AND password = @password';
      const request = new sql.Request();
      request.input('username', sql.VarChar, username);
      request.input('password', sql.VarChar, password);
  
      const result = await request.query(query);
  
      if (result.recordset.length === 0) {
        return res.status(401).json({ message: 'Usuario no encontrado o contraseña incorrecta' });
      }
  
      const usuario = result.recordset[0];
      req.session.usuario = { username: usuario.usuario, role: usuario.rol };
  
      // Redirigir según el rol
      if (usuario.rol === 'admin') {
        return res.json({ message: 'Sesión iniciada correctamente', redirect: '/crud/crud.html' });
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
  
  // Ruta protegida para admin
  app.get('/crud/crud.html', verificarAutenticacion('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/crud', 'crud.html'));
  });
  
  // Ruta protegida para index (usuarios normales)
  app.get('/index', verificarAutenticacion('user'), (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'index.html'));
  });
  
  // Servir archivos estáticos
  app.use('/static', express.static(path.join(__dirname, '../../public/static')));
  app.use('/crud', express.static(path.join(__dirname, '../../public/crud')));
  
  // Ruta para cerrar la sesión
  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  });



// Middleware para parsear el cuerpo de las solicitudes JSON
app.use(bodyParser.json());
// Middleware para parsear el cuerpo de las solicitudes URL-encoded
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos desde un directorio específico
app.use(express.static(path.join(__dirname, '../../public/crud')));

// Conectar a la base de datos al iniciar el servidor
connectDB();

// Configuración de almacenamiento en multer
const storage = multer.memoryStorage(); // Usamos almacenamiento en memoria para manejar archivos en el buffer
const upload = multer({ storage: storage }); // Inicializa multer con la configuración de almacenamiento

// Exportar la aplicación para su uso en otros módulos
module.exports = app;



/************************   
***** PARCELACION******
 *************************/
// Leer todos los ítems
app.get('/api/read/parcelacion', async (req, res) => {
    const sqlQuery = 'SELECT id, latitud, longitud, Comuna, Fase, Cultivo, registrada FROM VW_parcelacion';
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });

// obtener la imagen por su ID
app.get('/get-image', async (req, res) => {
    const id = req.query.id; // Obtiene el id

    try {
        // Consulta SQL para seleccionar la imagen correspondiente al ID
        const sqlQuery = `
            SELECT imagen 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;

        // Ejecutar la consulta con el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: parseInt(id) } // Convertir ID a entero
        ]);

        // Verificar si se encontró la imagen
        if (!result || result.length === 0 || !result[0].imagen) {
            return res.status(404).send('Imagen no encontrada.');
        }

        const imageBuffer = result[0].imagen; // Obtener el buffer de la imagen

        // Configurar los encabezados para la respuesta de la imagen
        res.setHeader('Content-Type', 'image/jpeg'); // Ajustar el tipo de contenido según el formato de la imagen
        res.send(imageBuffer); // Enviar el buffer de la imagen como respuesta

    } catch (err) {
        console.error('Error al obtener la imagen:', err);
        res.status(500).send('Error al obtener la imagen.'); 
    } 
});

// Crear un nuevo ítem
app.post('/api/create/parcelacion', upload.single('image'), async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { latitud, longitud, id_sector, id_fase, id_cultivo, registrada } = req.body;

    const sqlQuery = `
        INSERT INTO parcelacion (latitud, longitud, imagen, id_sector, id_fase, id_cultivo, registrada) 
        VALUES (@latitud, @longitud, @image_data, @id_sector, @id_fase, @id_cultivo, @registrada)
    `;

    // Convertir el buffer de la imagen a un formato adecuado, si es que se ha subido una imagen
    const imagenBuffer = req.file ? req.file.buffer : null;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'latitud', type: sql.Float, value: latitud },
            { name: 'longitud', type: sql.Float, value: longitud },
            { name: 'image_data', type: sql.VarBinary, value: imagenBuffer },
            { name: 'id_sector', type: sql.Int, value: id_sector },
            { name: 'id_fase', type: sql.Int, value: id_fase },
            { name: 'id_cultivo', type: sql.Int, value: id_cultivo },
            { name: 'registrada', type: sql.Int, value: registrada }
        ]);

        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
});


// Actualizar un ítem
app.put('/api/edit/parcelacion/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const { latitud, longitud, id_sector, id_fase, id_cultivo, registrada } = req.body; // Extraer datos del cuerpo de la solicitud

    const imagenBuffer = req.file ? req.file.buffer : null; // Convertir el buffer de la imagen a un formato adecuado, si es que se ha subido una imagen

    const sqlQuery = `
        UPDATE parcelacion 
        SET latitud = @latitud, 
            longitud = @longitud,
            id_sector = @id_sector, 
            id_fase = @id_fase, 
            id_cultivo = @id_cultivo, 
            registrada = @registrada, 
            imagen = @image_data 
        WHERE id_parcelacion = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'latitud', type: sql.Float, value: latitud },
            { name: 'longitud', type: sql.Float, value: longitud },
            { name: 'id_sector', type: sql.Int, value: id_sector },
            { name: 'id_fase', type: sql.Int, value: id_fase },
            { name: 'id_cultivo', type: sql.Int, value: id_cultivo },
            { name: 'registrada', type: sql.Int, value: registrada },
            { name: 'id', type: sql.Int, value: id }, // Añadir el ID a los parámetros
            { name: 'image_data', type: sql.VarBinary, value: imagenBuffer ? imagenBuffer : null } // Asigna null si no hay imagen
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
});


// Eliminar un ítem
app.delete('/api/delete/parcelacion/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM parcelacion WHERE id_parcelacion = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Leer los datos de un ítem por ID para rellenar el formulario de edición
app.get('/api/readEdit/parcelacion/:id', async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_parcelacion, latitud, longitud, id_sector, id_fase, id_cultivo, registrada 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: parseInt(id) } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
});


// Opciones para los campos id_fase, id_cultivo, id_sector
app.get('/opciones', async (req, res) => {
    try {
        // Consulta para obtener las fases
        const faseQuery = 'SELECT id_fase, nombre FROM fase';
        
        // Consulta para obtener los cultivos
        const cultivoQuery = 'SELECT id_cultivo, nombre FROM cultivo';
        
        // Consulta para obtener los sectores, concatenando el nombre de la región y la comuna
        const sectorQuery = `SELECT id_sector, sector FROM vw_sector`;

        // Realiza las consultas en paralelo y maneja errores en cada consulta
        const [fases, cultivos, sectores] = await Promise.all([
            query(faseQuery).catch(error => { throw new Error('Error en faseQuery: ' + error.message); }),
            query(cultivoQuery).catch(error => { throw new Error('Error en cultivoQuery: ' + error.message); }),
            query(sectorQuery).catch(error => { throw new Error('Error en sectorQuery: ' + error.message); })
        ]);

        // Envía la respuesta con los resultados de las consultas
        res.json({ fases, cultivos, sectores });

    } catch (error) {
        // Captura cualquier error que ocurra en el bloque try
        console.error('Error al obtener opciones:', error);
        return res.status(500).json({ message: 'Error al obtener opciones', error: error.message });
    }
});



/************************   
***** REGION ******
 *************************/
app.get('/api/read/region', async (req, res) => {
    const sqlQuery = 'SELECT id_region AS id, numero, nombre FROM region';
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });

// Crear un nuevo ítem
app.post('/api/create/region', upload.none(), async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { nombre, numero } = req.body;

    const sqlQuery = `
        INSERT INTO region (nombre, numero) 
        VALUES (@nombre, @numero)
    `;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'numero', type: sql.VarChar, value: numero }
        ]);

        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Leer los datos de un ítem por ID para rellenar el formulario de edición
app.get('/api/readEdit/region/:id', async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_region, nombre, numero 
            FROM region 
            WHERE id_region = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un ítem
app.put('/api/edit/region/:id', upload.none(), async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    // Debes usar `req.body` de manera adecuada
    const nombre = req.body.nombre; // Verifica que este valor no sea undefined
    const numero = req.body.numero; // Verifica que este valor no sea undefined

    console.log('Recibiendo id:', id);
    console.log('Recibiendo nombre:', nombre);
    console.log('Recibiendo numero:', numero);

    const sqlQuery = `
        UPDATE region 
        SET nombre = @nombre, 
            numero = @numero
        WHERE id_region = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'numero', type: sql.VarChar, value: numero },
            { name: 'id', type: sql.Int, value: id }
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
});

// Eliminar un ítem
app.delete('/api/delete/region/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM region WHERE id_region = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/************************   
***** PROVINCIA ******
 *************************/
app.get('/api/read/provincia', async (req, res) => {
    const sqlQuery = 'SELECT id, region, provincia FROM vw_provincia';
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });

// Crear un nuevo ítem
app.post('/api/create/provincia', upload.none(), async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { id_region, nombre } = req.body;

    const sqlQuery = `
        INSERT INTO provincia (nombre, id_region) 
        VALUES (@nombre, @id_region)
    `;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'id_region', type: sql.Int, value: id_region }
        ]);

        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Leer los datos de un ítem por ID para rellenar el formulario de edición
app.get('/api/readEdit/provincia/:id', async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_provincia, id_region, nombre 
            FROM provincia 
            WHERE id_provincia = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un ítem
app.put('/api/edit/provincia/:id', upload.none(), async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    // Debes usar `req.body` de manera adecuada
    const id_region = req.body.id_region; // Verifica que este valor no sea undefined
    const nombre = req.body.nombre; // Verifica que este valor no sea undefined

    console.log('Recibiendo id:', id);
    console.log('Recibiendo id_region:', id_region);
    console.log('Recibiendo nombre:', nombre);

    const sqlQuery = `
        UPDATE provincia 
        SET nombre = @nombre, 
            id_region = @id_region
        WHERE id_provincia = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'id_region', type: sql.Int, value: id_region },
            { name: 'id', type: sql.Int, value: id }
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
});

// Eliminar un ítem
app.delete('/api/delete/provincia/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM provincia WHERE id_provincia = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/************************   
***** SECTOR ******
 *************************/
app.get('/api/read/sector', async (req, res) => {
    const sqlQuery = 'SELECT id, provincia, comuna FROM vw_sector_completo';
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });

// Crear un nuevo ítem
app.post('/api/create/sector', upload.none(), async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { id_provincia, comuna } = req.body;

    const sqlQuery = `
        INSERT INTO sector (comuna, id_provincia) 
        VALUES (@comuna, @id_provincia)
    `;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'comuna', type: sql.VarChar, value: comuna },
            { name: 'id_provincia', type: sql.Int, value: id_provincia }
        ]);

        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Leer los datos de un ítem por ID para rellenar el formulario de edición
app.get('/api/readEdit/sector/:id', async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_sector, id_provincia, comuna 
            FROM sector 
            WHERE id_sector = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un ítem
app.put('/api/edit/sector/:id', upload.none(), async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    // Debes usar `req.body` de manera adecuada
    const id_provincia = req.body.id_provincia; // Verifica que este valor no sea undefined
    const comuna = req.body.comuna; // Verifica que este valor no sea undefined

    console.log('Recibiendo id:', id);
    console.log('Recibiendo id_provincia:', id_provincia);
    console.log('Recibiendo comuna:', comuna);

    const sqlQuery = `
        UPDATE sector 
        SET comuna = @comuna, 
            id_provincia = @id_provincia
        WHERE id_sector = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'comuna', type: sql.VarChar, value: comuna },
            { name: 'id_provincia', type: sql.Int, value: id_provincia },
            { name: 'id', type: sql.Int, value: id }
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
});

// Eliminar un ítem
app.delete('/api/delete/sector/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM sector WHERE id_sector = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Opciones para los campo provincia(Contien region y provincia) en EL FOMULARIO DE SECTOR
app.get('/opciones/sector', async (req, res) => {
    try {
        // Consulta para obtener las fases
        const sqlQuery = 'SELECT id_provincia, provincia FROM VW_listado_region_provincia;';

        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        // Captura cualquier error que ocurra en el bloque try
        console.error('Error al obtener opciones:', error);
        return res.status(500).json({ message: 'Error al obtener opciones', error: error.message });
    }
});

/************************   
***** CUARENTENA ******
 *************************/
app.get('/api/read/cuarentena', async (req, res) => {
    const sqlQuery = 'SELECT id, sector, latitud, longitud, [radio(Metros)] , motivo from vw_cuarentena ;';
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });

// Crear un nuevo ítem
app.post('/api/create/cuarentena', upload.none(), async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { latitud, longitud, radio, id_sector, comentario } = req.body;
    
    //Si llega como contenido 'null' o vacio lo trasforma en null
    const radioValue = (radio === 'null' || radio === '') ? null : Number(radio);

    console.log('fuera de la condicion', req.body);
    const sqlQuery = `
        INSERT INTO cuarentena (latitud, longitud, radio, id_sector, comentario) 
        VALUES (@latitud, @longitud, @radio, @id_sector, @comentario)
    `;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'latitud', type: sql.Float, value: latitud },
            { name: 'longitud', type: sql.Float, value: longitud },
            { name: 'radio', type: sql.Int, value: radioValue },
            { name: 'id_sector', type: sql.Int, value: id_sector },
            { name: 'comentario', type: sql.VarChar, value: comentario }
        ]);

        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Leer los datos de un ítem por ID para rellenar el formulario de edición
app.get('/api/readEdit/cuarentena/:id', async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_cuarentena, latitud, longitud, radio, id_sector, comentario 
            FROM cuarentena 
            WHERE id_cuarentena = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un ítem
app.put('/api/edit/cuarentena/:id', upload.none(), async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const { latitud, longitud, radio, id_sector, comentario } = req.body;

const radioValue = (radio === 'null' || radio === '') ? null : Number(radio);
    const sqlQuery = `
        UPDATE cuarentena 
        SET latitud = @latitud, 
            longitud = @longitud,
            radio = @radio,
            id_sector = @id_sector,
            comentario = @comentario
        WHERE id_cuarentena = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'latitud', type: sql.Float, value: latitud },
            { name: 'longitud', type: sql.Float, value: longitud },
            { name: 'radio', type: sql.Int, value: radioValue },
            { name: 'id_sector', type: sql.Int, value: id_sector },
            { name: 'comentario', type: sql.VarChar, value: comentario },
            { name: 'id', type: sql.Int, value: id }
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
});

// Eliminar un ítem
app.delete('/api/delete/cuarentena/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM cuarentena WHERE id_cuarentena = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/************************   
***** CULTIVO ******
 *************************/
app.get('/api/read/cultivo', async (req, res) => {
    const sqlQuery = 'SELECT id_cultivo AS id, nombre FROM cultivo ;';
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });

// Crear un nuevo ítem
app.post('/api/create/cultivo', upload.none(), async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { nombre } = req.body;

    const sqlQuery = `
        INSERT INTO cultivo (nombre) 
        VALUES (@nombre)
    `;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'nombre', type: sql.VarChar, value: nombre }
        ]);

        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Leer los datos de un ítem por ID para rellenar el formulario de edición
app.get('/api/readEdit/cultivo/:id', async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_cultivo, nombre 
            FROM cultivo 
            WHERE id_cultivo = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un ítem
app.put('/api/edit/cultivo/:id', upload.none(), async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const { nombre } = req.body;

    const sqlQuery = `
        UPDATE cultivo 
        SET nombre = @nombre
        WHERE id_cultivo = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'id', type: sql.Int, value: id }
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
});

// Eliminar un ítem
app.delete('/api/delete/cultivo/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM cultivo WHERE id_cultivo = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/************************   
***** FASE ******
 *************************/
app.get('/api/read/fase', async (req, res) => {
    const sqlQuery = 'SELECT id_fase AS id, nombre FROM fase ;';
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });

// Crear un nuevo ítem
app.post('/api/create/fase', upload.none(), async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { nombre } = req.body;

    const sqlQuery = `
        INSERT INTO fase (nombre) 
        VALUES (@nombre)
    `;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'nombre', type: sql.VarChar, value: nombre }
        ]);

        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Leer los datos de un ítem por ID para rellenar el formulario de edición
app.get('/api/readEdit/fase/:id', async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_fase, nombre 
            FROM fase 
            WHERE id_fase = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un ítem
app.put('/api/edit/fase/:id', upload.none(), async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const { nombre } = req.body;

    const sqlQuery = `
        UPDATE fase 
        SET nombre = @nombre
        WHERE id_fase = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'id', type: sql.Int, value: id }
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
});

// Eliminar un ítem
app.delete('/api/delete/fase/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM fase WHERE id_fase = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/************************   
***** USUARIO ******
 *************************/
app.get('/api/read/usuario', async (req, res) => {
    const sqlQuery = `SELECT id,[Nombre Completo], rut, correo, rol, usuario, password from vw_usuario`;
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });

// Crear un nuevo ítem
app.post('/api/create/usuario', upload.none(), async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { correo, password, usuario, rut, dv_rut, nombre, apellido, rol } = req.body;

    console.log(req.body);

    const sqlQuery = `
        INSERT INTO USUARIO (correo, password, usuario, rut, dv_rut, nombre, apellido, rol) 
        VALUES (@correo, @password, @usuario, @rut, @dv_rut, @nombre, @apellido, @rol)
    `;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'correo', type: sql.VarChar, value: correo },
            { name: 'password', type: sql.VarChar, value: password },
            { name: 'usuario', type: sql.VarChar, value: usuario },
            { name: 'rut', type: sql.Int, value: rut }, // Asegúrate de convertirlo al tipo correcto
            { name: 'dv_rut', type: sql.Char, value: dv_rut },
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'apellido', type: sql.VarChar, value: apellido },
            { name: 'rol', type: sql.VarChar, value: rol }
        ]);


        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Leer los datos de un ítem por ID para rellenar el formulario de edición
app.get('/api/readEdit/usuario/:id', async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_usuario, correo, password, usuario, rut, dv_rut, nombre, apellido, rol 
            FROM usuario 
            WHERE id_usuario = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un ítem
app.put('/api/edit/usuario/:id', upload.none(), async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const { correo, password, usuario, rut, dv_rut, nombre, apellido, rol } = req.body;
    
    console.log(req.body);

    const sqlQuery = `
        UPDATE usuario 
        SET correo = @correo,
            password =  @password,
            usuario = @usuario,
            rut = @rut,
            dv_rut = @dv_rut,
            nombre = @nombre, 
            apellido = @apellido,
            rol = @rol
        WHERE id_usuario = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'correo', type: sql.VarChar, value: correo },
            { name: 'password', type: sql.VarChar, value: password },
            { name: 'usuario', type: sql.VarChar, value: usuario },
            { name: 'rut', type: sql.Int, value: rut }, // Asegúrate de convertirlo al tipo correcto
            { name: 'dv_rut', type: sql.Char, value: dv_rut },
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'apellido', type: sql.VarChar, value: apellido },
            { name: 'rol', type: sql.VarChar, value: rol },
            { name: 'id', type: sql.Int, value: id }
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
});

// Eliminar un ítem
app.delete('/api/delete/usuario/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM usuario WHERE id_usuario = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/************************   
***** HISTORIAL ******
 *************************/
app.get('/api/read/historial', async (req, res) => {
    const sqlQuery = `SELECT id, tabla, [ID Parcelacion], accion, fecha, coordenadas, sector, fase, cultivo, registrada
                        FROM VW_historial;`;
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  });
// Iniciar servidor
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
