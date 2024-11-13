const { sql, query } = require('../../config/db');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
    console.log('Datos recibidos en /login:', req.body);
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios' });
        }
         // 1. Consultar la base de datos para obtener el usuario
        const sqlQuery = 'SELECT * FROM usuario WHERE usuario = @username';
        const result = await query(sqlQuery, [
            { name: 'username', type: sql.VarChar, value: username }
        ]);

        if (result.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado o contraseña incorrecta' });
        }

        const usuario = result[0];
        // 2. Comparar la contraseña proporcionada con el hash almacenado
        const isMatch = await bcrypt.compare(password, usuario.password); // Aquí se compara con el hash almacenado

        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

         // 3. Si la contraseña es correcta, crear la sesión
        req.session.usuario = { 
            username: usuario.usuario, 
            role: usuario.rol,
            userId: usuario.id_usuario // Añadir el ID a la sesión también
        };

        // 4. Determinar la redirección según el rol y enviar id
        let redirect;
        if (usuario.rol === 'Admin') {
            redirect = '/crud';
        } else if (usuario.rol === 'User') {
            redirect = '/index';
        } else {
            return res.status(403).json({ message: 'Rol de usuario no autorizado' });
        }

        // 5. Responder con la información necesaria
        return res.json({
            message: 'Sesión iniciada correctamente',
            redirect: redirect,
            userId: usuario.id_usuario, // Añade el ID del usuario a la respuesta
            rol: usuario.rol // El rol también se envía al frontend, si es necesario
        });

    } catch (err) {
        console.error('Error en el inicio de sesión:', err);
        return res.status(500).json({ message: 'Error en el inicio de sesión' });
    }
};

const logout = (req, res) => {
    req.session.destroy();
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
};

module.exports = {
    login,
    logout
};