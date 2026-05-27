const { Router } = require('express');
const { crearPedido, getPedidos, cancelarPedido } = require('../controllers/pedidos.controller');

const router = Router();

router.post('/',                crearPedido);
router.get('/',                 getPedidos);
router.patch('/:id/cancelar',   cancelarPedido);

module.exports = router;
