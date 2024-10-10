const { sql, query } = require('../../config/db'); // Importa la funciónes pra consultas y sql para trabar con SQL Server

/************************   
***** PARCELACION******
 *************************/
// Leer todos los ítems
const getParcelaciones = async (req, res) => {
    const sqlQuery = 'SELECT id, latitud, longitud, Comuna, Fase, Cultivo, registrada FROM VW_parcelacion';
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };

// obtener la imagen por su ID
const getImage = async (req, res) => {
    const id = req.query.id; // Obtiene el id

    try {
        // Consulta SQL para seleccionar la imagen correspondiente al ID
        const sqlQuery = `
            SELECT imagen 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;

        // Ejecutar la consulta con el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: parseInt(id) } // Convertir ID a entero
        ]);

        // Verificar si se encontró la imagen
        if (!result || result.length === 0 || !result[0].imagen) {
            return res.status(404).send('Imagen no encontrada.');
        }

        const imageBuffer = result[0].imagen; // Obtener el buffer de la imagen

        // Configurar los encabezados para la respuesta de la imagen
        res.setHeader('Content-Type', 'image/jpeg'); // Ajustar el tipo de contenido según el formato de la imagen
        res.send(imageBuffer); // Enviar el buffer de la imagen como respuesta

    } catch (err) {
        console.error('Error al obtener la imagen:', err);
        res.status(500).send('Error al obtener la imagen.'); 
    } 
};

// Crear un nuevo ítem
const createParcelacion = async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { latitud, longitud, id_sector, id_fase, id_cultivo, registrada } = req.body;

    const sqlQuery = `
        INSERT INTO parcelacion (latitud, longitud, imagen, id_sector, id_fase, id_cultivo, registrada) 
        VALUES (@latitud, @longitud, @image_data, @id_sector, @id_fase, @id_cultivo, @registrada)
    `;

    // Convertir el buffer de la imagen a un formato adecuado, si es que se ha subido una imagen
    const imagenBuffer = req.file ? req.file.buffer : null;

    try {
        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'latitud', type: sql.Float, value: latitud },
            { name: 'longitud', type: sql.Float, value: longitud },
            { name: 'image_data', type: sql.VarBinary, value: imagenBuffer },
            { name: 'id_sector', type: sql.Int, value: id_sector },
            { name: 'id_fase', type: sql.Int, value: id_fase },
            { name: 'id_cultivo', type: sql.Int, value: id_cultivo },
            { name: 'registrada', type: sql.Int, value: registrada }
        ]);

        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
};


// Leer los datos de un ítem por ID para rellenar el formulario de edición
const getParcelacionById = async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_parcelacion, latitud, longitud, id_sector, id_fase, id_cultivo, registrada 
            FROM parcelacion 
            WHERE id_parcelacion = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: parseInt(id) } // Convertir el ID a entero antes de pasarlo a la consulta
        ]);

        // Verificar si se encontró algún ítem
        if (result.length > 0) {
            // Si se encontró, devolver el primer ítem en formato JSON
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Ítem no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener ítem:', error.message); // Registrar el error en la consola para depuración
        res.status(500).json({ error: error.message });
    }
};


// Actualizar un ítem
const updateParcelacion = async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const { latitud, longitud, id_sector, id_fase, id_cultivo, registrada } = req.body; // Extraer datos del cuerpo de la solicitud

    const imagenBuffer = req.file ? req.file.buffer : null; // Convertir el buffer de la imagen a un formato adecuado, si es que se ha subido una imagen

    const sqlQuery = `
        UPDATE parcelacion 
        SET latitud = @latitud, 
            longitud = @longitud,
            id_sector = @id_sector, 
            id_fase = @id_fase, 
            id_cultivo = @id_cultivo, 
            registrada = @registrada, 
            imagen = @image_data 
        WHERE id_parcelacion = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'latitud', type: sql.Float, value: latitud },
            { name: 'longitud', type: sql.Float, value: longitud },
            { name: 'id_sector', type: sql.Int, value: id_sector },
            { name: 'id_fase', type: sql.Int, value: id_fase },
            { name: 'id_cultivo', type: sql.Int, value: id_cultivo },
            { name: 'registrada', type: sql.Int, value: registrada },
            { name: 'id', type: sql.Int, value: id }, // Añadir el ID a los parámetros
            { name: 'image_data', type: sql.VarBinary, value: imagenBuffer ? imagenBuffer : null } // Asigna null si no hay imagen
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
};


// Eliminar un ítem
const deleteParcelacion = async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM parcelacion WHERE id_parcelacion = @id'; 

    try {
        // Ejecutar la consulta de eliminación con el ID proporcionado
        await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Parámetro para la consulta
        ]);
        res.sendStatus(204); // Responder con código 204 (sin contenido) si la eliminación fue exitosa
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Opciones para los campos id_fase, id_cultivo, id_sector
const getOpciones = async (req, res) => {
    try {
        // Consulta para obtener las fases
        const faseQuery = 'SELECT id_fase, nombre FROM fase';
        
        // Consulta para obtener los cultivos
        const cultivoQuery = 'SELECT id_cultivo, nombre FROM cultivo';
        
        // Consulta para obtener los sectores, concatenando el nombre de la región y la comuna
        const sectorQuery = `SELECT id_sector, sector FROM vw_sector`;

        // Realiza las consultas en paralelo y maneja errores en cada consulta
        const [fases, cultivos, sectores] = await Promise.all([
            query(faseQuery).catch(error => { throw new Error('Error en faseQuery: ' + error.message); }),
            query(cultivoQuery).catch(error => { throw new Error('Error en cultivoQuery: ' + error.message); }),
            query(sectorQuery).catch(error => { throw new Error('Error en sectorQuery: ' + error.message); })
        ]);

        // Envía la respuesta con los resultados de las consultas
        res.json({ fases, cultivos, sectores });

    } catch (error) {
        // Captura cualquier error que ocurra en el bloque try
        console.error('Error al obtener opciones:', error);
        return res.status(500).json({ message: 'Error al obtener opciones', error: error.message });
    }
};

module.exports = {
    getParcelaciones,
    getImage,
    createParcelacion,
    getParcelacionById,
    updateParcelacion,
    deleteParcelacion,
    getOpciones
};