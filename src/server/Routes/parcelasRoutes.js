
const express = require('express');
const router = express.Router();
const { getParcelas,deleteParcela,getComuna,getParcelDataOptions,SaveParcel } = require('../controllers/parcelasController');

router.get('/get-comuna/parcelas', getComuna);
router.get('/', getParcelas);
router.delete('/delete-parcela/:id', deleteParcela);
router.get('/api/DataOptions', getParcelDataOptions);
router.post('/api/SaveParcel', SaveParcel);
module.exports = router;
