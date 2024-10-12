const express = require('express');
const router = express.Router();
const multer = require('multer');
const cuarentenaController = require('../../controllers/AdminControllers/cuarentenaControllers');

const upload = multer(); // Configurar multer para manejo de archivos

// Definir las rutas
router.get('/filter', cuarentenaController.getFilteredCuarentenas);
router.get('/', cuarentenaController.getCuarentenas);                 // Leer todas las cuarentenas
router.post('/', upload.none(), cuarentenaController.createCuarentena);              // Crear nueva cuarentena
router.get('/:id', cuarentenaController.getCuarentenaById);           // Leer cuarentena por ID
router.put('/:id', upload.none(), cuarentenaController.updateCuarentena);            // Actualizar cuarentena
router.delete('/:id', cuarentenaController.deleteCuarentena);         // Eliminar cuarentena

module.exports = router;