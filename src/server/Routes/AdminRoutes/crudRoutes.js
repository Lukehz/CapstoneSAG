const express = require('express');
const path = require('path'); // No olvides importar path

const router = express.Router();

// Proteger la ruta para que solo los administradores accedan a ella
router.get('/crud.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/crud', 'crud.html'));
});

module.exports = router;
