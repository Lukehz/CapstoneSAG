// src/controllers/predictController.js
const { exec } = require('child_process');
const path = require('path');

const predictImage = (req, res, next) => {
    console.log('Archivo subido:', req.file); // Verificar información del archivo subido
    if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const imagePath = req.file.path;
    const scriptPath = path.join(__dirname, '../pythonScripts/prediccionYOLO.py');

    // Ejecutar el script de Python
    exec(`python3 ${scriptPath} ${imagePath}`, (error, stdout, stderr) => {
        // Mostrar cualquier advertencia o error del script en stderr
        if (stderr) {
            console.warn('Advertencias o errores del script:', stderr);
        }

        if (error) {
            console.error('Error en la predicción:', error);
            return res.status(500).json({ error: 'Error en la predicción', details: stderr });
        }

        // Filtrar y limpiar la salida del script para extraer solo el JSON
        const cleanOutput = stdout.trim();

        console.log('Salida del script:', cleanOutput);

        // Usar una expresión regular para extraer la parte que es un JSON válido
        const jsonRegex = /\[.*\]/s;  // Buscar el bloque de JSON que comienza con [ y termina con ]
        const jsonMatch = cleanOutput.match(jsonRegex);

        if (!jsonMatch) {
            console.error('No se encontró un JSON válido en la salida del script');
            return res.status(500).json({ error: 'No se encontró un JSON válido en la salida del script', details: cleanOutput });
        }

        const jsonString = jsonMatch[0];

        try {
            // Intentar parsear la salida limpia como JSON
            const predictions = JSON.parse(jsonString);
            res.json({ predictions });
        } catch (parseError) {
            console.error('Error al procesar los resultados:', parseError);
            res.status(500).json({ error: 'Error al procesar los resultados', details: jsonString });
        }
    });
};

module.exports = { predictImage };
