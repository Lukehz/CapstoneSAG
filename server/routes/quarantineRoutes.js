const express = require('express');
const router = express.Router();
const { saveQuarantine, getAllQuarantines, deleteQuarantine} = require('../controllers/quarantineController'); 

// Ruta para guardar cuarentena
router.post('/save-quarantine', saveQuarantine)
router.get('/get-all-quarantines', getAllQuarantines);
router.delete('delete-quarantine/:id', deleteQuarantine)

module.exports = router;
