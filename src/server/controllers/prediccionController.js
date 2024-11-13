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

    exec(`python3 ${scriptPath} ${imagePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error en la predicción:', error);
            return res.status(500).json({ error: 'Error en la predicción', details: stderr });
        }
    
        // Filtrar logs o advertencias no deseadas
        const cleanOutput = stdout.trim();
    
        console.log('Salida del script:', cleanOutput);
    
        try {
            const predictions = JSON.parse(cleanOutput); // Intentar parsear solo si es JSON válido
            res.json({ predictions });
        } catch (parseError) {
            console.error('Error al procesar los resultados:', parseError);
            res.status(500).json({ error: 'Error al procesar los resultados', details: cleanOutput });
        }
    });
};

module.exports = { predictImage };
