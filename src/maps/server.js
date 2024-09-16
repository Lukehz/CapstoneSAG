const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');

const app = express();
const port = 3000;

// Configuración de CORS
app.use(cors());
app.use(express.json()); // Para analizar el cuerpo de las solicitudes JSON

// Configuración para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../../public')));

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

// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Ha ocurrido un error en el servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Ruta para obtener parcelas
app.get('/parcelas', async (req, res, next) => {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM vw_parcelacion');
    res.json(result.recordset);
  } catch (err) {
    next(new Error('Error al obtener parcelas: ' + err.message));
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

app.post('/save-quarantine', async (req, res) => {
  const { points, comentario } = req.body;
  if (!comentario || typeof comentario !== 'string' || comentario.trim() === '') {
    return res.status(400).json({ success: false, error: 'El campo "comentario" es obligatorio y debe ser una cadena válida.' });
  }

  let pool;
  let transaction;
  let idCuarentena;

  try {
    pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Paso 1: Guardar la cuarentena
    try {
      const resultCuarentena = await transaction.request()
        .input('latitud', sql.Float, points[0][1])
        .input('longitud', sql.Float, points[0][0])
        .input('radio', sql.Float, null)
        .input('id_sector', sql.Int, 1)
        .input('comentario', sql.NVarChar, comentario)
        .query('INSERT INTO dbo.cuarentena (latitud, longitud, radio, id_sector, comentario) OUTPUT INSERTED.id_cuarentena VALUES (@latitud, @longitud, @radio, @id_sector, @comentario)');
      
      idCuarentena = resultCuarentena.recordset[0].id_cuarentena;
      console.log(`Cuarentena guardada con ID: ${idCuarentena}`);
    } finally {}

    // Paso 2: Guardar los vértices
    try {
      for (let i = 0; i < points.length; i++) {
        await transaction.request()
          .input('id_cuarentena', sql.Int, idCuarentena)
          .input('latitud', sql.Float, points[i][1])
          .input('longitud', sql.Float, points[i][0])
          .input('orden', sql.Int, i + 1)
          .query('INSERT INTO dbo.vertice (id_cuarentena, latitud, longitud, orden) VALUES (@id_cuarentena, @latitud, @longitud, @orden)');
      }
      console.log(`Vértices guardados para la cuarentena ID: ${idCuarentena}`);
    } catch (error) {
      throw new Error(`Error al guardar los vértices: ${error.message}`);
    }

    // Paso 3: Ejecutar el procedimiento almacenado
    try {
      await transaction.request()
        .input('id_cuarentena', sql.Int, idCuarentena)
        .execute('sp_CrearConexionesCuarentena');
      console.log(`Procedimiento almacenado ejecutado para la cuarentena ID: ${idCuarentena}`);
    } catch (error) {
      throw new Error(`Error al ejecutar sp_CrearConexionesCuarentena: ${error.message}`);
    }

    // Si llegamos aquí, todo se ha ejecutado correctamente
    await transaction.commit();
    res.status(201).json({
      success: true,
      id_cuarentena: idCuarentena,
      message: 'Cuarentena guardada exitosamente con todos sus componentes'
    });

  } catch (error) {
    console.error('Error en el proceso de guardar cuarentena:', error);
    if (transaction) await transaction.rollback();
    
    // Determinar qué se guardó y qué no
    let message = 'Error al procesar la cuarentena: ';
    if (idCuarentena) {
      message += `Cuarentena guardada con ID ${idCuarentena}, pero hubo un error en pasos posteriores. `;
    }
    message += error.message;

    res.status(500).json({
      success: false,
      error: message,
      id_cuarentena: idCuarentena // Enviar el ID si se llegó a crear
    });
  } finally {
    if (pool) await pool.close();
  }
});
// Manejo de ruta no encontrada (para cualquier ruta no especificada)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Usar el middleware de manejo de errores
app.use(errorHandler);

// Inicialización del servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  process.exit(1);
});