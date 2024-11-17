const express = require('express');
const router = express.Router();
const { getComentario, saveQuarantine, getAllQuarantines, getAllRadiusQuarantines, getComuna, deactivateQuarantine, getInactiveQuarantines, getInactivaTrazado, activateQuarantine} = require('../controllers/quarantineController'); 

// Ruta para guardar cuarentena
router.post('/save-quarantine', saveQuarantine);
router.get('/get-all-quarantines', getAllQuarantines);
router.get('/get-comentario', getComentario);
router.get('/radius', getAllRadiusQuarantines);
router.get('/comuna', getComuna);// Ruta para desactivar una cuarentena (cambiar 'activa' a 0)
router.put('/deactivate-quarantine/:id', deactivateQuarantine);
router.get('/inactiva', getInactiveQuarantines);
router.get('/inactiva-trazado', getInactivaTrazado);
router.put('/activa/:id', activateQuarantine)

module.exports = router;
