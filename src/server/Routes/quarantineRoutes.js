    const express = require('express');
    const router = express.Router();
    const { getComentario,  saveQuarantine, getAllQuarantines, getAllRadiusQuarantines, deleteQuarantine, getComuna} = require('../controllers/quarantineController'); 

    // Ruta para guardar cuarentena
    router.post('/save-quarantine', saveQuarantine);
    router.get('/get-all-quarantines', getAllQuarantines);
    router.get('/get-comentario', getComentario);
    router.get('/radius', getAllRadiusQuarantines);
    router.get('/comuna', getComuna); // Esta es la ruta que necesitas para las comunas
    router.delete('/delete-quarantine/:id', deleteQuarantine);

    module.exports = router;
