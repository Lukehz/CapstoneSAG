const express = require('express');
const router = express.Router();
const multer = require('multer');
const regionController = require('../../controllers/AdminControllers/regionControllers');

const upload = multer(); // Configurar multer para manejo de archivos

// Rutas para las operaciones CRUD
router.get('/', regionController.getRegion);             // Leer todas las regiones
router.post('/', upload.none(), regionController.createRegion);          // Crear nueva región
router.get('/:id', regionController.getRegionById);      // Leer región por ID
router.put('/:id', upload.none(), regionController.updateRegion);        // Actualizar región
router.delete('/:id', regionController.deleteRegion);     // Eliminar región

module.exports = router;