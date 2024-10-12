//parcelasRoutes//

const express = require('express');
const router = express.Router();
const { getParcelas,deleteParcela,getComuna } = require('../controllers/parcelasController');

router.get('/get-comuna/parcelas', getComuna);
router.get('/', getParcelas);
router.delete('/delete-parcela/:id', deleteParcela);
module.exports = router;
