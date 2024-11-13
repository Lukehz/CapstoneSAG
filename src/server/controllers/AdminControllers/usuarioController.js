const { sql, query } = require('../../config/db'); // Importa la funciónes pra consultas y sql para trabar con SQL Server
const bcrypt = require('bcryptjs');

/************************   
***** USUARIO ******
 *************************/
const getUsuario = async (req, res) => {
    const sqlQuery = `SELECT id,[Nombre Completo], rut, correo, rol, usuario, password from vw_usuario`;
    try {
        const result = await query(sqlQuery);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo ítem
const createUsuario = async (req, res) => {
    // Extraer datos del cuerpo de la solicitud
    const { correo, password, usuario, rut, dv_rut, nombre, apellido, rol } = req.body;

    console.log(req.body);

    const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

    // Primero, verificar si el RUT ya existe en la base de datos
    const checkRutQuery = `
        SELECT COUNT(*) AS count FROM USUARIO WHERE rut = @rut
    `;

    try {
        const checkResult = await query(checkRutQuery, [
            { name: 'rut', type: sql.Int, value: rut } // Asegúrate de convertirlo al tipo correcto
        ]);

        // Si el RUT ya existe, devolver un error
        if (checkResult[0].count > 0) {
            const errorMessage = 'El RUT ya está registrado.';
            console.log(errorMessage); // Log del mensaje de error
            return res.status(400).json({ error: errorMessage });
        }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sqlQuery = `
        INSERT INTO USUARIO (correo, password, usuario, rut, dv_rut, nombre, apellido, rol) 
        VALUES (@correo, @password, @usuario, @rut, @dv_rut, @nombre, @apellido, @rol)
    `;

        // Ejecutar la consulta SQL con los parámetros correspondientes
        const result = await query(sqlQuery, [
            { name: 'correo', type: sql.VarChar, value: correo },
            { name: 'password', type: sql.VarChar, value: hashedPassword }, // Usar la contraseña hasheada
            { name: 'usuario', type: sql.VarChar, value: usuario },
            { name: 'rut', type: sql.Int, value: rut }, // Asegúrate de convertirlo al tipo correcto
            { name: 'dv_rut', type: sql.Char, value: dv_rut },
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'apellido', type: sql.VarChar, value: apellido },
            { name: 'rol', type: sql.VarChar, value: rol }
        ]);


        // Responder con el resultado de la inserción y código 201 (creado)
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear ítem:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Leer los datos de un ítem por ID para rellenar el formulario de edición
const getUsuarioById = async (req, res) => {
    // Extraer el ID del parámetro de la solicitud
    const { id } = req.params;

    try {
        const sqlQuery = `
            SELECT id_usuario, correo, password, usuario, rut, dv_rut, nombre, apellido, rol 
            FROM usuario 
            WHERE id_usuario = @id
        `;
        
        // Ejecutar la consulta pasando el ID como parámetro
        const result = await query(sqlQuery, [
            { name: 'id', type: sql.Int, value: id } // Convertir el ID a entero antes de pasarlo a la consulta
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
const updateUsuario = async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const { correo, usuario, rut, dv_rut, nombre, apellido, rol } = req.body;
    
    console.log(req.body);

    const sqlQuery = `
        UPDATE usuario 
        SET correo = @correo,
            usuario = @usuario,
            rut = @rut,
            dv_rut = @dv_rut,
            nombre = @nombre, 
            apellido = @apellido,
            rol = @rol
        WHERE id_usuario = @id
    `;

    try {
        // Crea los parámetros para la consulta
        await query(sqlQuery, [
            { name: 'correo', type: sql.VarChar, value: correo },
            //{ name: 'password', type: sql.VarChar, value: password },
            { name: 'usuario', type: sql.VarChar, value: usuario },
            { name: 'rut', type: sql.Int, value: rut }, // Asegúrate de convertirlo al tipo correcto
            { name: 'dv_rut', type: sql.Char, value: dv_rut },
            { name: 'nombre', type: sql.VarChar, value: nombre },
            { name: 'apellido', type: sql.VarChar, value: apellido },
            { name: 'rol', type: sql.VarChar, value: rol },
            { name: 'id', type: sql.Int, value: id }
        ]);

        res.sendStatus(204); // Responder con código 204 (sin contenido) si la actualización fue exitosa
    } catch (error) {
        console.error('Error al actualizar ítem:', error.message); // Log del error
        res.status(500).json({ error: error.message }); // Responder con error 500 en caso de fallo
    }
};

// Eliminar un ítem
const deleteUsuario = async (req, res) => {
    const { id } = req.params; // Obtiene el ID del ítem desde la URL
    const sqlQuery = 'DELETE FROM usuario WHERE id_usuario = @id'; 

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

const getFilteredUsuario = async (req, res) => {
    const { roles } = req.query; // Obtener los roles desde la consulta

    let sqlQuery = `SELECT id, [Nombre Completo], rut, correo, rol, usuario, password FROM vw_usuario WHERE 1=1`;
    const params = [];

    // Filtrar por roles si se proporciona
    if (roles) {
        const roleArray = roles.split(',').map(role => role.trim());
        sqlQuery += ` AND rol IN (${roleArray.map((_, index) => `@role${index}`).join(', ')})`;
        roleArray.forEach((role, index) => {
            params.push({ name: `role${index}`, type: sql.VarChar, value: role });
        });
    }

    // Agregar logs para depuración
    console.log('SQL Query:', sqlQuery);
    console.log('Parameters:', params);

    try {
        const result = await query(sqlQuery, params); // Ejecuta la consulta
        res.json(result); // Devuelve el resultado
    } catch (error) {
        console.error('Error executing query:', error); // Log del error
        res.status(500).json({ error: error.message }); // Manejo de errores
    }
};

module.exports = {
    getUsuario,
    createUsuario,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
    getFilteredUsuario
};