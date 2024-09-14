const sql = require('mssql');

// Configuración de conexión
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
  

// Función para conectar a la base de datos
const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log('Conexión exitosa a SQL Server');
    } catch (error) {
        console.error('Error al conectar a SQL Server:', error.message);
    }
};

// Exportar la conexión
module.exports = {
    connectDB,
    sql
};
