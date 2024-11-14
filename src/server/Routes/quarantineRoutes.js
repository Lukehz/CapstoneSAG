const express = require('express');
const router = express.Router();
const { getComentario, saveQuarantine, getAllQuarantines, getAllRadiusQuarantines, getComuna, deactivateQuarantine, getInactiveQuarantines} = require('../controllers/quarantineController'); 

// Ruta para guardar cuarentena
router.post('/save-quarantine', saveQuarantine);
router.get('/get-all-quarantines', getAllQuarantines);
router.get('/get-comentario', getComentario);
router.get('/radius', getAllRadiusQuarantines);
router.get('/comuna', getComuna);
router.put('/deactivate-quarantine/:id', deactivateQuarantine);
router.get('/inactiva', getInactiveQuarantines);

module.exports = router;
