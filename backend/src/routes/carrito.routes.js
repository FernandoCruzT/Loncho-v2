const { Router } = require('express');
const {
  getCarrito,
  agregarItem,
  actualizarCantidad,
  eliminarItem,
  vaciarCarrito,
} = require('../controllers/carrito.controller');

const router = Router();

router.get('/',                getCarrito);
router.post('/',               agregarItem);
router.put('/:producto_id',    actualizarCantidad);
router.delete('/:producto_id', eliminarItem);
router.delete('/',             vaciarCarrito);

module.exports = router;
