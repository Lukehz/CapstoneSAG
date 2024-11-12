const express = require('express');
const router = express.Router();
const multer = require('multer');
const usuarioController = require('../../controllers/AdminControllers/usuarioController');

const upload = multer(); // Configurar multer para manejo de archivos

// Definir las rutas
router.get('/filter', usuarioController.getFilteredUsuario);
router.get('/', usuarioController.getUsuario);                 // Leer todos los usuarios
router.post('/', upload.none(), usuarioController.createUsuario);              // Crear nuevo usuario
router.get('/:id', usuarioController.getUsuarioById);           // Leer usuario por ID
router.put('/:id', upload.none(), usuarioController.updateUsuario);            // Actualizar usuario
router.delete('/:id', usuarioController.deleteUsuario);         // Eliminar usuario

module.exports = router;
