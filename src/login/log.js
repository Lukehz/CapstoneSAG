const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;

// Clave secreta para JWT
const SECRET_KEY = 'mi_clave_secreta';

// Configuración de CORS y JSON
app.use(cors());
app.use(express.json()); // Para analizar las solicitudes JSON

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

// Conectar a la base de datos
sql.connect(config)
  .then(() => console.log('Conexión a la base de datos exitosa'))
  .catch(err => console.error('Error al conectar a la base de datos:', err));

// Ruta para el login
app.post('/login', async (req, res) => {
    try {
        // Validar que los campos estén presentes
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios' });
        }

        const { username, password } = req.body;

        // Crear la consulta para buscar el usuario en la base de datos
        const request = new sql.Request();
        request.input('username', sql.VarChar, username);

        // Ejecutar la consulta
        const result = await request.query('SELECT * FROM usuario WHERE nombre_usuario = @username');

        console.log('Resultado de la consulta:', result);
        const usuario = result.recordset[0];
        console.log('Valor de usuario:', usuario);
        

        // Comparar la contraseña ingresada con la almacenada (hasheada)
        const esContraseñaValida = await bcrypt.compare(password, usuario.contrasena);
        if (!esContraseñaValida) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        
        // Generar el token JWT
        const token = jwt.sign({ username: usuario.nombre_usuario }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (err) {
        console.error('Error en el inicio de sesión:', err);
        res.status(500).json({ message: 'Error en el inicio de sesión', error: err });
    }
});

// Ruta protegida
app.get('/protected', (req, res) => {
    const token = req.headers['authorization'];

    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado, token no proporcionado o inválido' });
    }

    try {
        const decodedToken = jwt.verify(token.split(' ')[1], SECRET_KEY);
        res.status(200).json({ message: `Bienvenido, ${decodedToken.username}` });
    } catch (err) {
        res.status(401).json({ message: 'Token no válido' });
    }
});

// Servir el archivo login.html desde la carpeta public
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'login.html'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
