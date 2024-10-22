    const express = require('express');
    const router = express.Router();
    const { getComentario, saveQuarantine, getAllQuarantines, getAllRadiusQuarantines, deleteQuarantine} = require('../controllers/quarantineController'); 

    // Ruta para guardar cuarentena
    router.post('/save-quarantine', saveQuarantine)
    router.get('/get-all-quarantines', getAllQuarantines);
    router.get('/get-comentario/quarantines', getComentario);
    router.get('/radius', getAllRadiusQuarantines);
    router.delete('/delete-quarantine/:id', deleteQuarantine);

    module.exports = router;
