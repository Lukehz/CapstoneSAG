// src/controllers/predictController.js
const { exec } = require('child_process');
const path = require('path');

const predictImage = (req, res, next) => {
    const imagePath = req.file.path;
    const scriptPath = path.join(__dirname, '../pythonScripts/prediccionYOLO.py'); // Ruta al script Python

    // Ejecuta el script Python
    exec(`python3 ${scriptPath} ${imagePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error en la predicción:', error);
            return res.status(500).json({ error: 'Error en la predicción' });
        }

        try {
            const predictions = JSON.parse(stdout); // Convertir la salida a JSON
            res.json({ predictions });
        } catch (parseError) {
            console.error('Error al procesar los resultados:', parseError);
            res.status(500).json({ error: 'Error al procesar los resultados' });
        }
    });
};

module.exports = { predictImage };
