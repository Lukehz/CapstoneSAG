/* conexion a la bd */

const sql = require('mssql');
const config = require('../config/database');

const getConnection = async () => {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
};

module.exports = {
  getConnection
};