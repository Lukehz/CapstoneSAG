const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

exports.handlePrediction = (req, res) => {
  try {
    const imagePath = req.file.path; // Ruta de la imagen cargada
    const outputDir = path.join(__dirname, '../../public/static/results'); // Carpeta donde guardar la imagen procesada

    // Comando para ejecutar el script de predicción
    const command = `python3 server/scriptsPy/prediccionYOLO.py ${imagePath} ${outputDir}`;

    // Ejecuta el script
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return res.status(500).send('Error al realizar la predicción.');
      }

      // Parsear la salida del script (JSON)
      const prediction = JSON.parse(stdout);

      // Elimina la imagen original después de procesarla
      fs.unlinkSync(imagePath);

      // Renderiza la vista con los resultados
      res.render('predictionResult', {
        predictionImage: `/static/results/${prediction.processedImage}`,
        predictionData: prediction.detections,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error procesando la predicción.');
  }
};
