const express = require('express');
const router = express.Router();
const multer = require('multer');
const cultivoController = require('../../controllers/AdminControllers/cultivoController');

const upload = multer(); // Configurar multer para manejo de archivos

// Definir las rutas
router.get('/', cultivoController.getCultivo);                 // Leer todas las cultivo
router.post('/', upload.none(), cultivoController.createCultivo);              // Crear nueva cultivo
router.get('/:id',  cultivoController.getCultivoById);           // Leer cultivo por ID
router.put('/:id', upload.none(), cultivoController.updateCultivo);            // Actualizar cultivo
router.delete('/:id', cultivoController.deleteCultivo);         // Eliminar cultivo

module.exports = router;