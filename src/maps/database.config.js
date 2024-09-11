const sql = require('mssql');


const config = {
  user: 'Luc_hernandez_SQLLogin_1',
  password: 'nus1f946z7',
  server: 'ProyectoCapstone.mssql.somee.com',
  database: 'ProyectoCapstone',
  options: {
    encrypt: true,
    trustServerCertificate: true // Agrega esta opción
  }
};


module.exports = config;


// Ruta para obtener parcelas
app.get('/parcelas', async (req, res) => {
    try {
      // Conectar a la base de datos
      let pool = await sql.connect(config);
  
      // Consulta SQL
      let result = await pool.request()
        .query('SELECT TOP (1000) [id_parcelacion], [latitud], [longitud], [imagen], [id_sector], [id_fase], [id_cultivo], [registrada] FROM [dbo].[parcelacion]');
  
      // Enviar los datos en formato JSON
      res.json(result.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error en el servidor');
    }
  });
  
  // Iniciar el servidor
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
