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
                 v.latitud as vertice_lat, v.longitud as vertice_lon, v.orden
          FROM dbo.cuarentena c
          LEFT JOIN dbo.vertice v ON c.id_cuarentena = v.id_cuarentena
          ORDER BY c.id_cuarentena, v.orden
        `);
  
      const quarantines = result.recordset.reduce((acc, row) => {
        if (!acc[row.id_cuarentena]) {
          acc[row.id_cuarentena] = {
            id: row.id_cuarentena,
            latitud: row.latitud,
            longitud: row.longitud,
            radio: row.radio,
            comentario: row.comentario,
            vertices: []
          };
        }
        if (row.vertice_lat && row.vertice_lon) {
          acc[row.id_cuarentena].vertices.push([row.vertice_lon, row.vertice_lat]);
        }
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
  
  module.exports = {
    saveQuarantine,
    getAllQuarantines
  };
  