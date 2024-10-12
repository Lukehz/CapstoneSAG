const express = require('express');
const router = express.Router();
const { getComentario, saveQuarantine, getAllQuarantines, deleteQuarantine} = require('../controllers/quarantineController'); 

// Ruta para guardar cuarentena
router.post('/save-quarantine', saveQuarantine)
router.get('/get-all-quarantines', getAllQuarantines);
router.get('/get-comentario/quarantines', getComentario);
router.delete('/quarantines/:id', deleteQuarantine);

module.exports = router;
