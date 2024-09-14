const express = require('express');
const multer = require('multer');
const path = require('path');
const { connectDB, sql } = require('./db'); // Importa la función de conexión y el módulo sql
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

// Endpoint para subir imagen a la base de datos
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha subido ninguna imagen.');
    }

    try {
        // Conectar a la base de datos
        await connectDB();

        // Consulta para insertar la imagen en la base de datos
        const query = `
            INSERT INTO parcelacion (latitud, longitud, imagen, id_sector, id_fase, id_cultivo, registrada) 
            VALUES (@latitud, @longitud, @image_data, @id_sector, @id_fase, @id_cultivo, @registrada)
        `;
        
        // Usamos el método `request` para ejecutar la consulta parametrizada
        const request = new sql.Request();
        request.input('latitud', sql.Float, req.body.latitud);
        request.input('longitud', sql.Float, req.body.longitud);
        request.input('image_data', sql.VarBinary, req.file.buffer);
        request.input('id_sector', sql.Int, req.body.id_sector);
        request.input('id_fase', sql.Int, req.body.id_fase);
        request.input('id_cultivo', sql.Int, req.body.id_cultivo);
        request.input('registrada', sql.Bit, req.body.registrada);
        await request.query(query);

        res.send('Imagen subida exitosamente.');
    } catch (err) {
        console.error('Error al subir la imagen:', err);
        res.status(500).send('Error al subir la imagen.');
    } finally {
        // Cerrar la conexión a la base de datos
        sql.close();
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
        const query = `
            SELECT latitud, longitud, id_sector, id_fase, id_cultivo, registrada 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;

        const request = new sql.Request();
        request.input('id', sql.Int, id);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send('Datos no encontrados.');
        }

        const { latitud, longitud, id_sector, id_fase, id_cultivo, registrada } = result.recordset[0];

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
    } finally {
        sql.close();
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
        const query = `
            SELECT imagen 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;

        const request = new sql.Request();
        request.input('id', sql.Int, id);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send('Imagen no encontrada.');
        }

        const imageBuffer = result.recordset[0].imagen;
        
        // Configurar los encabezados para la imagen
        res.setHeader('Content-Type', 'image/jpeg'); // Ajusta el tipo de contenido si es necesario
        res.send(imageBuffer);

    } catch (err) {
        console.error('Error al obtener la imagen:', err);
        res.status(500).send('Error al obtener la imagen.');
    } finally {
        // Cerrar la conexión a la base de datos
        sql.close();
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
        const query = `
            SELECT imagen 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;

        const request = new sql.Request();
        request.input('id', sql.Int, id);

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send('Imagen no encontrada.');
        }

        const imageBuffer = result.recordset[0].imagen;

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
    } finally {
        // Cerrar la conexión a la base de datos
        sql.close();
    }
});

// Servir archivos estáticos (front-end)
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
