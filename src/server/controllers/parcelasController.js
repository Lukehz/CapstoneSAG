const { connectDB, sql } = require('../config/db');

const getParcelas = async (req, res, next) => {
  try {
    const result = await sql.query('SELECT * FROM vw_parcelacion');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en getParcelas:', err); // Imprime el error para depuración
    next(new Error('Error al obtener parcelas: ' + err.message));
  }
};

const getComuna = async (req, res, next) => {
  try {
    // Ejecutar la consulta
    const result = await sql.query(`
      SELECT p.id_parcelacion, p.latitud, p.longitud, s.comuna, c.nombre AS cultivo
      FROM parcelacion p
      INNER JOIN sector s ON p.id_sector = s.id_sector
      INNER JOIN cultivo c ON p.id_cultivo = c.id_cultivo
    `);

    // Devolver los resultados como JSON
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en getComuna:', err); // Imprime el error para depuración
    next(new Error('Error al obtener las comunas: ' + err.message));
  }
};

const deleteParcela = async (req, res) => {
  const { id } = req.params; // Verificar si el ID está llegando correctamente
  let transaction;

  try {
    // Verifica si el ID es un número válido
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    // Comenzar la transacción
    transaction = new sql.Transaction();
    await transaction.begin();

    // Realiza la eliminación
    const result = await transaction.request()
      .input('id_parcelacion', sql.Int, id) // Asegúrate de que el ID sea pasado correctamente
      .query('DELETE FROM parcelacion WHERE id_parcelacion = @id_parcelacion');

    await transaction.commit();

    if (result.rowsAffected[0] > 0) {
      console.log(`Parcela con ID ${id} eliminada correctamente.`);
      res.json({ success: true, message: `Parcela con ID ${id} eliminada exitosamente.` });
    } else {
      console.log(`No se encontró una parcela con ID ${id}.`);
      res.status(404).json({ success: false, message: `No se encontró una parcela con ID ${id}.` });
    }

  } catch (error) {
    console.error('Error al eliminar la parcela:', error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, message: 'Error al eliminar la parcela' });
  }
};

module.exports = {
  getParcelas,
  deleteParcela,
  getComuna
};