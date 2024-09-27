/* Maneja las operaciones de los datos de cuarentena que estan relacionada con la bd */

const sql = require('mssql');
const { getConnection } = require('../Models/db');

const saveQuarantine = async (req, res) => {
  const { points, comment: comentario } = req.body;
  if (!comentario || typeof comentario !== 'string' || comentario.trim() === '') {
    return res.status(400).json({ success: false, error: 'El campo "comentario" es obligatorio y debe ser una cadena válida.' });
  }

  let pool;
  let transaction;
  let idCuarentena;

  try {
    pool = await getConnection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Paso 1: Guardar la cuarentena
    const resultCuarentena = await transaction.request()
      .input('latitud', sql.Float, points[0][1])
      .input('longitud', sql.Float, points[0][0])
      .input('radio', sql.Float, null)
      .input('id_sector', sql.Int, 1)
      .input('comentario', sql.NVarChar, comentario)
      .query('INSERT INTO dbo.cuarentena (latitud, longitud, radio, id_sector, comentario) OUTPUT INSERTED.id_cuarentena VALUES (@latitud, @longitud, @radio, @id_sector, @comentario)');
    
    idCuarentena = resultCuarentena.recordset[0].id_cuarentena;
    console.log(`Cuarentena guardada con ID: ${idCuarentena}`);

    // Paso 2: Guardar los vértices
    for (let i = 0; i < points.length; i++) {
      await transaction.request()
        .input('id_cuarentena', sql.Int, idCuarentena)
        .input('latitud', sql.Float, points[i][1])
        .input('longitud', sql.Float, points[i][0])
        .input('orden', sql.Int, i + 1)
        .query('INSERT INTO dbo.vertice (id_cuarentena, latitud, longitud, orden) VALUES (@id_cuarentena, @latitud, @longitud, @orden)');
    }
    console.log(`Vértices guardados para la cuarentena ID: ${idCuarentena}`);

    // Paso 3: Ejecutar el procedimiento almacenado
    await transaction.request()
      .input('id_cuarentena', sql.Int, idCuarentena)
      .execute('sp_CrearConexionesCuarentena');
    console.log(`Procedimiento almacenado ejecutado para la cuarentena ID: ${idCuarentena}`);

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
  let pool;
  try {
    pool = await getConnection();
    const result = await pool.request()
      .query(`
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
  } finally {
    if (pool) await pool.close();
  }
};

const deleteQuarantine = async (req, res) => {
  const { id } = req.params;
  let pool;
  let transaction;

  try {
    pool = await getConnection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Paso 1: Eliminar las conexiones
    await transaction.request()
      .input('id_cuarentena', sql.Int, id)
      .query('DELETE FROM dbo.conexion_cuarentena WHERE id_cuarentena = @id_cuarentena');

    // Paso 2: Eliminar los vértices
    await transaction.request()
      .input('id_cuarentena', sql.Int, id)
      .query('DELETE FROM dbo.vertice WHERE id_cuarentena = @id_cuarentena');

    // Paso 3: Eliminar la cuarentena
    const result = await transaction.request()
      .input('id_cuarentena', sql.Int, id)
      .query('DELETE FROM dbo.cuarentena WHERE id_cuarentena = @id_cuarentena');

    await transaction.commit();

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: `Cuarentena con ID ${id} eliminada exitosamente` });
    } else {
      res.status(404).json({ success: false, message: `No se encontró una cuarentena con ID ${id}` });
    }
  } catch (error) {
    console.error('Error al eliminar la cuarentena:', error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (pool) await pool.close();
  }
};

module.exports = {
  saveQuarantine,
  getAllQuarantines,
  deleteQuarantine  // Añade esta línea
};