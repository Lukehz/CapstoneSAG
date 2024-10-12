const http = require('http');
const app = require('./app'); // Importa la instancia de la aplicación configurada en app.js
const { connectDB } = require('./config/db'); // Importa la función de conexión a la base de datos

const PORT = process.env.PORT || 3000;

// Conectar a la base de datos y luego iniciar el servidor
connectDB()
    .then(() => {
        // Iniciar el servidor
        const server = http.createServer(app);
        server.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('No se pudo iniciar el servidor debido a un error de conexión a la base de datos:', error.message);
    });