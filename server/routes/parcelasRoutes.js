const express = require('express');
const router = express.Router();
const { getParcelas } = require('../controllers/parcelasController');

router.get('/', getParcelas);

module.exports = router;