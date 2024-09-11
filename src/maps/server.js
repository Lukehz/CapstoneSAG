const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const app = express();
const port = 3000;

// Configuración de CORS
app.use(cors());

// Configuración para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la base de datos
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


app.get('/parcelas', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request()
     .query('SELECT * FROM vw_parcelacion');

    res.json(result.recordset);
  } catch (err) {
    res.status(500).send('Error al obtener parcelas de la base de datos');
  }
});

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
    // Ajusta la ruta para ir un nivel arriba desde `src/maps`
    const filePath = path.join(__dirname, '..', '..', 'public', 'index.html');
    res.sendFile(filePath);
  });
  

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});