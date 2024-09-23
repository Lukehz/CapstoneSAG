const express = require('express');
const router = express.Router();
const { saveQuarantine, getAllQuarantines } = require('../controllers/quarantineController'); 

// Ruta para guardar cuarentena
router.post('/save-quarantine', saveQuarantine)
router.get('/get-all-quarantines', getAllQuarantines);

module.exports = router;
