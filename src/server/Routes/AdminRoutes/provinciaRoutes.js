const express = require('express');
const router = express.Router();
const multer = require('multer');
const provinciaController = require('../../controllers/AdminControllers/provinciaControllers');

const upload = multer(); // Configurar multer para manejo de archivos

// Rutas para las operaciones CRUD
// Ruta para obtener provincias filtradas
router.get('/filter', provinciaController.getFilteredProvincia);
router.get('/', provinciaController.getProvincia);            // Leer todas las provincias
router.post('/', upload.none(), provinciaController.createProvincia);         // Crear nueva provincia
router.get('/:id', provinciaController.getProvinciaById);     // Leer provincia por ID
router.put('/:id', upload.none(), provinciaController.updateProvincia);       // Actualizar provincia
router.delete('/:id', provinciaController.deleteProvincia);    // Eliminar provincia

module.exports = router;
