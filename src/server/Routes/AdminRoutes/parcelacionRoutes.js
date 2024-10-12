const express = require('express');
const router = express.Router();
const multer = require('multer');
const parcelacionController = require('../../controllers/AdminControllers/parcelacionController');

const upload = multer(); // Configurar multer para manejo de archivos

// Definir las rutas
// Ruta para obtener parcelaciones filtradas
router.get('/filter', parcelacionController.getFilteredParcelaciones);
router.get('/', parcelacionController.getParcelaciones);                 // Leer todas las parcelaciones
router.post('/', upload.single('image'),  parcelacionController.createParcelacion);              // Crear nueva parcelacion

router.get('/get-image', parcelacionController.getImage);               // Obtener la imagen por ID
router.get('/opciones', parcelacionController.getOpciones);             // Opciones para campos
router.get('/:id', parcelacionController.getParcelacionById);           // Leer parcelacion por ID
router.put('/:id', upload.single('image'), parcelacionController.updateParcelacion);            // Actualizar parcelacion
router.delete('/:id', parcelacionController.deleteParcelacion);         // Eliminar parcelacion

module.exports = router;
