const express     = require('express');
const router      = express.Router();
const emailCtrl   = require('../controllers/email.controller');

router.post('/recibo', emailCtrl.enviarRecibo);

module.exports = router;
