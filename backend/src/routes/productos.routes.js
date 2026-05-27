const { Router } = require('express');
const { getProductos, getProductoById } = require('../controllers/productos.controller');

const router = Router();

router.get('/',    getProductos);
router.get('/:id', getProductoById);

module.exports = router;
