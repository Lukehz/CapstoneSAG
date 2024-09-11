const sql = require('mssql');
const path = require('path');
const databaseConfig = require(path.join(__dirname, '../maps/database.config.js'));

// Conectar a la base de datos de SQL Server
sql.connect(databaseConfig).then(pool => {
  // Ejecutar una consulta a la base de datos
  pool.request().query('SELECT * FROM parcelacion').then(result => {
    // Procesar los resultados de la consulta
    const parcelas = result.recordset;
    // Aquí puedes procesar los resultados o enviar datos al frontend si es necesario
  }).catch(err => {
    console.error('Error en la consulta:', err);
  });
}).catch(err => {
  console.error('Error en la conexión a la base de datos:', err);
});
