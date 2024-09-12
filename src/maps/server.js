const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const app = express();
const port = 3000;


// Configuración de CORS
app.use(cors());
app.use(express.json()); // Para analizar el cuerpo de las solicitudes JSON


// Configuración para servir archivos estáticos
// Ajusta la ruta para que apunte a la carpeta 'public' en el directorio raíz del proyecto
app.use(express.static(path.join(__dirname, '../../public')));


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


// Ruta para obtener parcelas
app.get('/parcelas', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM vw_parcelacion');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener parcelas:', err);
    res.status(500).send('Error al obtener parcelas de la base de datos');
  }
});


app.post('/save-quarantine', async (req, res) => {
  const { points } = req.body;
  if (!points || points.length < 3) {
    return res.status(400).send('Debe haber al menos tres puntos para guardar una cuarentena.');
  }


  try {
    let pool = await sql.connect(config);
    let idCuarentena = new Date().getTime(); // Generar ID único para la cuarentena


    // 1. Insertar la cuarentena en la tabla `cuarentenas` (si es necesario)
    // Suponiendo que tienes una tabla llamada `cuarentenas` para almacenar la cuarentena
    await pool.request()
      .input('id_cuarentena', sql.BigInt, idCuarentena)
      .query('INSERT INTO dbo.cuarentenas (id_cuarentena) VALUES (@id_cuarentena)');


    // 2. Insertar los puntos en la tabla `vertice`
    for (let i = 0; i < points.length; i++) {
      await pool.request()
        .input('id_cuarentena', sql.BigInt, idCuarentena)
        .input('latitud', sql.Float, points[i][1])
        .input('longitud', sql.Float, points[i][0])
        .input('orden', sql.Int, i + 1) // El orden debe empezar desde 1
        .query('INSERT INTO dbo.vertice (id_cuarentena, latitud, longitud, orden) VALUES (@id_cuarentena, @latitud, @longitud, @orden)');
    }


    // 3. Ejecutar el procedimiento almacenado para crear conexiones
    await pool.request()
      .input('id_cuarentena', sql.Int, idCuarentena)
      .execute('sp_CrearConexionesCuarentena');


    res.status(200).send('Cuarentena guardada con éxito.');
  } catch (err) {
    console.error('Error al guardar la cuarentena:', err); // Muestra el error en la consola
    res.status(500).send('Error al guardar la cuarentena en la base de datos');
  }
});




// Manejo de ruta no encontrada (para cualquier ruta no especificada)
app.use((req, res) => {
  res.status(404).send('Ruta no encontrada');
});


// Inicialización del servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});





