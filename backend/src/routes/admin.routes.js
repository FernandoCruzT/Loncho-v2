const express        = require('express');
const router         = express.Router();
const adminCtrl      = require('../controllers/admin.controller');

router.get('/usuarios',                  adminCtrl.getUsuarios);
router.get('/productos',                 adminCtrl.getProductos);
router.put('/productos/:id',             adminCtrl.updateProducto);
router.patch('/productos/:id/toggle-stock', adminCtrl.toggleStock);

module.exports = router;
