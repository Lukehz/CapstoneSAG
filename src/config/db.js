const sql = require('mssql');

// Configuración de la base de datos
const dbConfig = {
  user: 'Luc_hernandez_SQLLogin_1',
  password: 'nus1f946z7',
  server: 'ProyectoCapstone.mssql.somee.com',
  database: 'ProyectoCapstone',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Función para conectar a la base de datos
const connectToDatabase = async () => {
  try {
    await sql.connect(dbConfig);
    console.log('Conexión a la base de datos exitosa');
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    throw err;
  }
};

module.exports = {
  sql, // Exportar la instancia de `mssql` para que puedas usarla en otros archivos
  connectToDatabase // Exportar la función de conexión
};