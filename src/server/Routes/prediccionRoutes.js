// src/routes/predictRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Carpeta para almacenar imágenes temporalmente

const { predictImage } = require('../controllers/predictController');

// Ruta para la predicción
router.post('/predict', upload.single('image'), predictImage);

module.exports = router;
