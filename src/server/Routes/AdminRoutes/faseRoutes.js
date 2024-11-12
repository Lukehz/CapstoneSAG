const express = require('express');
const router = express.Router();
const multer = require('multer');
const faseController = require('../../controllers/AdminControllers/faseController');

const upload = multer(); // Configurar multer para manejo de archivos

// Rutas para las operaciones CRUD
router.get('/', faseController.getFase);                     // Leer todas las fases
router.post('/', upload.none(), faseController.createFase);                   // Crear nueva fase
router.get('/:id', faseController.getFaseById);               // Leer fase por ID
router.put('/:id', upload.none(), faseController.updateFase);                 // Actualizar fase
router.delete('/:id', faseController.deleteFase);              // Eliminar fase

module.exports = router;