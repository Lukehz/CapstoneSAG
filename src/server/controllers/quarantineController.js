const { connectDB, sql } = require('../config/db');

const saveQuarantine = async (req, res) => {
  const { points, comment: comentario, type, radius } = req.body;
  if (!comentario || typeof comentario !== 'string' || comentario.trim() === '') {
    return res.status(400).json({ success: false, error: 'El campo "comentario" es obligatorio y debe ser una cadena válida.' });
  }

  let pool;
  let transaction;
  let idCuarentena;

  try {
    pool = await connectDB();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    let latitud, longitud, radio = null;
    
    if (type === 'polygon') {
      if (points.length < 3) {
        return res.status(400).json({ success: false, error: 'Se requieren al menos 3 puntos para un trazado.' });
      }
      latitud = points[0][1];
      longitud = points[0][0];
    } else if (type === 'radius') {
      if (!points[0] || points[0].length !== 2 || !radius || isNaN(radius)) {
        return res.status(400).json({ success: false, error: 'Se requiere un punto central y un radio válido para una cuarentena por radio.' });
      }
      latitud = points[0][1];
      longitud = points[0][0];
      radio = parseFloat(radius);
    } else {
      return res.status(400).json({ success: false, error: 'El campo "type" debe ser "polygon" o "radius".' });
    }

    // Paso 1: Guardar la cuarentena
    const resultCuarentena = await transaction.request()
      .input('latitud', sql.Float, latitud)
      .input('longitud', sql.Float, longitud)
      .input('radio', sql.Float, radio)
      .input('id_sector', sql.Int, 1)
      .input('comentario', sql.NVarChar, comentario)
      .query('INSERT INTO dbo.cuarentena (latitud, longitud, radio, id_sector, comentario) OUTPUT INSERTED.id_cuarentena VALUES (@latitud, @longitud, @radio, @id_sector, @comentario)');
    
    idCuarentena = resultCuarentena.recordset[0].id_cuarentena;
    console.log(`Cuarentena guardada con ID: ${idCuarentena}`);

    // Paso 2: Guardar los vértices solo si es un trazado
    if (type === 'polygon') {
      for (let i = 0; i < points.length; i++) {
        await transaction.request()
          .input('id_cuarentena', sql.Int, idCuarentena)
          .input('latitud', sql.Float, points[i][1])
          .input('longitud', sql.Float, points[i][0])
          .input('orden', sql.Int, i + 1)
          .query('INSERT INTO dbo.vertice (id_cuarentena, latitud, longitud, orden) VALUES (@id_cuarentena, @latitud, @longitud, @orden)');
      }
      console.log(`Vértices guardados para la cuarentena ID: ${idCuarentena}`);
    }

    // Paso 3: Ejecutar el procedimiento almacenado
    await transaction.request()
      .input('id_cuarentena', sql.Int, idCuarentena)
      .execute('sp_CrearConexionesCuarentena');
    console.log(`Procedimiento almacenado ejecutado para la cuarentena ID: ${idCuarentena}`);

    await transaction.commit();
    res.status(201).json({
      success: true,
      id_cuarentena: idCuarentena,
      message: 'Cuarentena guardada exitosamente con todos sus componentes'
    });

  } catch (error) {
    console.error('Error en el proceso de guardar cuarentena:', error);
    if (transaction) await transaction.rollback();
    
    let message = 'Error al procesar la cuarentena: ';
    if (idCuarentena) {
      message += `Cuarentena guardada con ID ${idCuarentena}, pero hubo un error en pasos posteriores. `;
    }
    message += error.message;

    res.status(500).json({
      success: false,
      error: message,
      id_cuarentena: idCuarentena
    });
  } finally {
    if (pool) await pool.close();
  }
};

const getAllQuarantines = async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT c.id_cuarentena, c.latitud, c.longitud, c.radio, c.comentario, 
             v.id_conexion, v.latitud_INI, v.longitud_INI, v.latitud_END, v.longitud_END, v.ORDEN
      FROM dbo.cuarentena c
      INNER JOIN VW_conexiones_cuarentena v ON c.id_cuarentena = v.id_cuarentena
      ORDER BY c.id_cuarentena, v.ORDEN
    `);

    const quarantines = result.recordset.reduce((acc, row) => {
      if (!acc[row.id_cuarentena]) {
        acc[row.id_cuarentena] = {
          id: row.id_cuarentena,
          latitud: row.latitud,
          longitud: row.longitud,
          radio: row.radio,
          comentario: row.comentario,
          conexiones: [] // Cambié a conexiones
        };
      }
    
      acc[row.id_cuarentena].conexiones.push({
        id_conexion: row.id_conexion,
        latitud_INI: row.latitud_INI,
        longitud_INI: row.longitud_INI,
        latitud_END: row.latitud_END,
        longitud_END: row.longitud_END,
        orden: row.ORDEN
      });
      return acc;
    }, {});

    res.json(Object.values(quarantines));
  } catch (error) {
    console.error('Error al obtener cuarentenas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

let isDeleting = false; // Flag para evitar duplicación de la acción

const deleteQuarantine = async (req, res) => {
  const { id } = req.params;
  console.log(`Recibida solicitud para eliminar cuarentena con ID: ${id}`);

  if (!id) {
    console.log('ID de cuarentena no proporcionado');
    return res.status(400).json({ success: false, message: 'ID de cuarentena no proporcionado' });
  }

  // Verificar si ya hay una operación de eliminación en curso
  if (isDeleting) {
    console.log('Eliminación de cuarentena ya en curso, rechazando solicitud duplicada.');
    return res.status(429).json({ success: false, message: 'Eliminación ya en proceso, por favor espere.' });
  }

// Marcar el proceso de eliminación como iniciado
  isDeleting = true;

  let pool;
  let transaction; 
  let attempt = 0;
  const maxAttempts = 5; // Máximo de reintentos por deadlock

  while (attempt < maxAttempts) {
    try {
      attempt++;
      pool = await connectDB();
      console.log('Conexión a la base de datos establecida');
      transaction = new sql.Transaction(pool);
      await transaction.begin();
      console.log('Transacción iniciada');

      const checkResult = await transaction.request()
        .input('id_cuarentena', sql.Int, id)
        .query('SELECT * FROM dbo.cuarentena WHERE id_cuarentena = @id_cuarentena');

      if (checkResult.recordset.length === 0) {
        console.log(`Cuarentena con ID ${id} no encontrada`);
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Cuarentena no encontrada' });
      }

      console.log(`Cuarentena con ID ${id} encontrada, procediendo a eliminar`);

      // Eliminar conexiones relacionadas
      await transaction.request()
        .input('id_cuarentena', sql.Int, id)
        .query('DELETE FROM dbo.conexion WHERE verticeInicial_id IN (SELECT id_vertice FROM dbo.vertice WHERE id_cuarentena = @id_cuarentena)');
      console.log(`Conexiones eliminadas para la cuarentena ID: ${id}`);

      // Eliminar vértices
      await transaction.request()
        .input('id_cuarentena', sql.Int, id)
        .query('DELETE FROM dbo.vertice WHERE id_cuarentena = @id_cuarentena');
      console.log(`Vértices eliminados para la cuarentena ID: ${id}`);

      // Finalmente, eliminar la cuarentena
      const deleteResult = await transaction.request()
        .input('id_cuarentena', sql.Int, id)
        .query('DELETE FROM dbo.cuarentena WHERE id_cuarentena = @id_cuarentena');

      if (deleteResult.rowsAffected[0] === 0) {
        console.log(`No se pudo eliminar la cuarentena con ID: ${id}`);
        await transaction.rollback();
        return res.status(500).json({ success: false, message: 'No se pudo eliminar la cuarentena' });
      }

      await transaction.commit();
      console.log(`Cuarentena con ID ${id} eliminada exitosamente`);
      // Reiniciar el flag tras eliminar correctamente
      isDeleting = false;

      res.status(200).json({ success: true, message: 'Cuarentena eliminada exitosamente' });
      return; // Salir de la función si todo va bien
      

    } catch (error) {
      if (error.number === 1205) { // Deadlock
        console.warn(`Deadlock detectado. Intentando de nuevo... (${attempt}/${maxAttempts})`);
        if (transaction) await transaction.rollback();
        continue; // Volver a intentar
      }

      console.error('Error al eliminar cuarentena:', error);
      if (transaction) await transaction.rollback();
      // Reiniciar el flag si ocurre un error
      isDeleting = false;
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar la cuarentena',
        error: error.message 
      });
      return; // Salir de la función ante un error no relacionado con deadlock
    } finally {
      if (pool) {
        await pool.close();
        console.log('Conexión a la base de datos cerrada');
      }
    }
  }

  // Si se alcanzó el número máximo de intentos
  res.status(500).json({ success: false, message: 'Se alcanzó el número máximo de intentos para eliminar la cuarentena debido a un deadlock.' });
};

const getComentario = async (req, res) => {
  console.log('Obteniendo comentarios');
  
  try {
    // Ejecutar la consulta
    const result = await sql.query(`
      SELECT DISTINCT c.id_cuarentena, 
                      c.latitud, 
                      c.longitud, 
                      c.radio, 
                      c.comentario, 
                      s.id_sector, 
                      s.comuna  -- Incluye la comuna
      FROM dbo.cuarentena c
      LEFT JOIN sector s ON c.id_sector = s.id_sector
      ORDER BY c.id_cuarentena
    `);

    // Devolver los resultados como JSON
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener comentarios:', err);
    res.status(500).json({ error: 'Error al obtener información: ' + err.message });
  }
};
      
module.exports = {
  saveQuarantine,
  getAllQuarantines,
  deleteQuarantine,
  getComentario
};