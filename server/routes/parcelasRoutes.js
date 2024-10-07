/* parcelasRoutes.js*/
const express = require('express');
const router = express.Router();
const { getParcelas,deleteParcela } = require('../controllers/parcelasController');

router.get('/', getParcelas);
// Define la ruta para eliminar una parcela por ID
router.delete('/delete-parcela/:id', deleteParcela);

module.exports = router;
