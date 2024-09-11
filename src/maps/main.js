const sql = require('mssql');
const path = require('path');
const databaseConfig = require(path.join(__dirname, '../maps/database.config.js'));


// Conectar a la base de datos de SQL Server
sql.connect(databaseConfig).then(pool => {
  // Ejecutar una consulta a la base de datos
  pool.request().query('SELECT * FROM SECTOR').then(result => {
    // Procesar los resultados de la consulta
    const data = result.recordset;


    // Imprimir los datos en la consola del sistema
    console.log('Datos obtenidos:');
    console.log(data);
  });
});
