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
        throw error; // Lanza el error para manejarlo donde se llame
    }
};

// Función para realizar consultas
const query = async (sqlQuery) => {
    try {
        const result = await sql.query(sqlQuery);
        return result.recordset; // Devuelve los resultados de la consulta
    } catch (error) {
        console.error('Error en la consulta SQL:', error.message);
        throw error; // Lanza el error para que sea manejado en el endpoint
    }
};

// Exportar la conexion y funcion
module.exports = {
    connectDB,
    sql,
    query // Asegúrate de exportar la función query también
};
