const { sql, query } = require('../../config/db');

const login = async (req, res) => {
    console.log('Datos recibidos en /login:', req.body);
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios' });
        }
        
        const sqlQuery = 'SELECT * FROM usuario WHERE usuario = @username AND password = @password';

        const result = await query(sqlQuery, [
            { name: 'username', type: sql.VarChar, value: username },
            { name: 'password', type: sql.VarChar, value: password }
        ]);

        if (result.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado o contraseña incorrecta' });
        }
        
        const usuario = result[0];
        req.session.usuario = { 
            username: usuario.usuario, 
            role: usuario.rol,
            userId: usuario.id_usuario // Añadir el ID a la sesión también
        };

        // Determinar la redirección según el rol y enviar el ID
        let redirect;
        if (usuario.rol === 'Admin') {
            redirect = '/crud';
        } else if (usuario.rol === 'User') {
            redirect = '/index';
        } else {
            return res.status(403).json({ message: 'Rol de usuario no autorizado' });
        }

        // Enviar la respuesta con toda la información necesaria
        return res.json({
            message: 'Sesión iniciada correctamente',
            redirect: redirect,
            userId: usuario.id_usuario, // Añadir el ID del usuario a la respuesta
            rol: usuario.rol // Opcional: también puedes enviar el rol si lo necesitas en el frontend
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
