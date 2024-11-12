const express = require('express');
const router = express.Router();
const multer = require('multer');
const sectorController = require('../../controllers/AdminControllers/sectorControllers');

const upload = multer(); // Configurar multer para manejo de archivos

// Rutas para las operaciones CRUD
router.get('/filter', sectorController.getFilteredSector);
router.get('/', sectorController.getSector);                   // Leer todos los sectores
router.post('/', upload.none(), sectorController.createSector);                 // Crear nuevo sector
router.get('/opciones', sectorController.getOpcionesSector);          // Opciones para el formulario de sector
router.get('/:id', sectorController.getSectorById);             // Leer sector por ID
router.put('/:id', upload.none(), sectorController.updateSector);               // Actualizar sector
router.delete('/:id', sectorController.deleteSector);            // Eliminar sector

module.exports = router;