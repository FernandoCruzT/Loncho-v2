const { Router }                    = require('express');
const { createOrder, captureOrder } = require('../controllers/paypal.controller');

const router = Router();

router.post('/create-order',  createOrder);
router.post('/capture-order', captureOrder);

module.exports = router;
