const express = require('express');
const multer = require('multer');
const path = require('path');
const { connectDB, sql, query } = require('./config/db'); // Importa la función de conexión y el módulo sql
const sharp = require('sharp'); // Necesitamos sharp para procesar imágenes

const app = express();
const port = 3000;

// Configuración de almacenamiento en multer
const storage = multer.memoryStorage(); // Usamos almacenamiento en memoria para manejar el archivo en el buffer
const upload = multer({ storage: storage });

// Conectar a la base de datos al iniciar el servidor
connectDB().catch(err => {
    console.error('Error al iniciar el servidor:', err.message);
    process.exit(1); // Salir si no se puede conectar a la base de datos
});

// Servir el archivo upload.html como la página de inicio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/upload.html'));
});

// Opciones para los campos id_fase, id_cultivo, id_sector
app.get('/opciones', async (req, res) => {
    try {
        await connectDB(); // Asegúrate de que connectDB devuelva una promesa

        const faseQuery = 'SELECT id_fase, nombre FROM fase';
        const cultivoQuery = 'SELECT id_cultivo, nombre FROM cultivo';
        const sectorQuery = `
            SELECT 
                s.id_sector, 
                CONCAT(r.nombre, ', ', s.comuna) AS Sector 
            FROM sector s 
            LEFT JOIN provincia p ON p.id_provincia = s.id_provincia 
            LEFT JOIN region r ON r.id_region = p.id_region
        `;

        // Realiza las consultas en paralelo
        const [fases, cultivos, sectores] = await Promise.all([
            query(faseQuery).catch(error => { throw new Error('Error en faseQuery: ' + error.message); }),
            query(cultivoQuery).catch(error => { throw new Error('Error en cultivoQuery: ' + error.message); }),
            query(sectorQuery).catch(error => { throw new Error('Error en sectorQuery: ' + error.message); })
        ]);

        // Envía la respuesta con los resultados
        res.json({ fases, cultivos, sectores });

    } catch (error) {
        console.error('Error al obtener opciones:', error);
        return res.status(500).json({ message: 'Error al obtener opciones', error: error.message });
    }
});


// Función para realizar consultas de manera asíncrona



// Endpoint para subir imagen a la base de datos
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha subido ninguna imagen.');
    }

    try {
        // Conectar a la base de datos
        await connectDB();

        // Consulta para insertar la imagen en la base de datos
        const sqlQuery = `
            INSERT INTO parcelacion (latitud, longitud, imagen, id_sector, id_fase, id_cultivo, registrada) 
            VALUES (@latitud, @longitud, @image_data, @id_sector, @id_fase, @id_cultivo, @registrada)
        `;

        // Usar la función `query` para ejecutar la consulta
        await query(sqlQuery, [
            { name: 'latitud', type: sql.Float, value: parseFloat(req.body.latitud) },
            { name: 'longitud', type: sql.Float, value: parseFloat(req.body.longitud) },
            { name: 'image_data', type: sql.VarBinary, value: req.file.buffer },
            { name: 'id_sector', type: sql.Int, value: parseInt(req.body.id_sector) },
            { name: 'id_fase', type: sql.Int, value: parseInt(req.body.id_fase) },
            { name: 'id_cultivo', type: sql.Int, value: parseInt(req.body.id_cultivo) },
            { name: 'registrada', type: sql.Bit, value: Number(req.body.registrada) } // Asegúrate de que sea un booleano
        ]);

        res.send('Imagen subida exitosamente.');
    } catch (err) {
        console.error('Error al subir la imagen:', err);
        res.status(500).send('Error al subir la imagen.');
    }
});

// Endpoint para obtener los datos de la imagen
app.get('/get-data', async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.status(400).send('ID de parcelación no proporcionado.');
    }

    try {
        // Conectar a la base de datos
        await connectDB();

        // Consulta para obtener los datos de la base de datos
        const sqlQuery = `
            SELECT latitud, longitud, id_sector, id_fase, id_cultivo, registrada 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;

        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: parseInt(id) }
        ]);

        console.log('Resultado de la consulta:', result); // Para depuración

        if (result.length === 0) {
            return res.status(404).send('Datos no encontrados.');
        }

        const { latitud, longitud, id_sector, id_fase, id_cultivo, registrada } = result[0];

        res.json({
            latitud,
            longitud,
            id_sector,
            id_fase,
            id_cultivo,
            registrada
        });

    } catch (err) {
        console.error('Error al obtener los datos:', err);
        res.status(500).send('Error al obtener los datos.');
    } 
});

// Endpoint para obtener la imagen
app.get('/get-image', async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.status(400).send('ID de parcelación no proporcionado.');
    }

    try {
        // Conectar a la base de datos
        await connectDB();

        // Consulta para obtener la imagen desde la base de datos
        const sqlQuery = `
            SELECT imagen 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;

        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: parseInt(id) }
        ]);

        console.log('Resultado de la consulta:', result); // Depuración

        // Verifica que result no esté vacío y tenga la estructura esperada
        if (!result || result.length === 0 || !result[0].imagen) {
            return res.status(404).send('Imagen no encontrada.');
        }

        const imageBuffer = result[0].imagen;
        
        // Configurar los encabezados para la imagen
        res.setHeader('Content-Type', 'image/jpeg'); // Ajusta el tipo de contenido si es necesario
        res.send(imageBuffer);

    } catch (err) {
        console.error('Error al obtener la imagen:', err);
        res.status(500).send('Error al obtener la imagen.');
    } 
});

// Endpoint para obtener la matriz de píxeles de la imagen
app.get('/get-pixel-matrix', async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.status(400).send('ID de parcelación no proporcionado.');
    }

    try {
        // Conectar a la base de datos
        await connectDB();

        // Consulta para obtener la imagen desde la base de datos
        const sqlQuery = `
            SELECT imagen 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;

        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: parseInt(id) }
        ]);

        if (result.length === 0) {
            return res.status(404).send('Imagen no encontrada.');
        }

        const imageBuffer = result[0].imagen;

        // Procesar la imagen para obtener la matriz de píxeles
        const image = sharp(imageBuffer);
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
        const matrix = [];
        let offset = 0;

        for (let y = 0; y < info.height; y++) {
            const row = [];
            for (let x = 0; x < info.width; x++) {
                const r = data[offset];
                const g = data[offset + 1];
                const b = data[offset + 2];
                row.push([r, g, b]);
                offset += 3;
            }
            matrix.push(row);
        }

        // Convertir la matriz a una cadena en formato NumPy
        const matrixString = `${JSON.stringify(matrix)}`;

        // Enviar la matriz como texto
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename=pixel_matrix.txt');
        res.send(matrixString);

    } catch (err) {
        console.error('Error al obtener la matriz de píxeles:', err);
        res.status(500).send('Error al obtener la matriz de píxeles.');
    } 
});

// Servir archivos estáticos (front-end)
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
