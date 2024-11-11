const express = require('express');
const router = express.Router();
const multer = require('multer');
const perfilController = require('../../controllers/AdminControllers/perfilController');

const upload = multer(); // Configurar multer para manejo de archivos

// Definir las rutas
// Ruta para obtener parcelaciones filtradas
router.get('/:id', perfilController.getPerfil);

module.exports = router;
