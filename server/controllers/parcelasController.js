/* parcelaController.js*/

const { getConnection } = require('../Models/db');

const getParcelas = async (req, res, next) => {
  let pool;
  try {
    pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM vw_parcelacion');
    res.json(result.recordset);
  } catch (err) {
    next(new Error('Error al obtener parcelas: ' + err.message));
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};

module.exports = {
  getParcelas
};