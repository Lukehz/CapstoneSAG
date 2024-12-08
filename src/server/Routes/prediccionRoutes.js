const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediccionController.js');
const multer = require('multer'); // Para manejar cargas de archivos

// Configuración de multer
const upload = multer({ dest: 'uploads/' }); // Carpeta temporal para guardar imágenes

router.post('/prediccion', upload.single('image'), predictionController.handlePrediction);

module.exports = router;