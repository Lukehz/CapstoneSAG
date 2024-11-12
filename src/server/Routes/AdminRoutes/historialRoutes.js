const express = require('express');
const router = express.Router();
const historialController = require('../../controllers/AdminControllers/historialController');

// Definir las rutas
router.get('/', historialController.getHistorial);                 // Leer todos los historial

module.exports = router;
