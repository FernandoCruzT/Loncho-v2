const paypalService = require('../services/paypal.service');
const pool          = require('../config/db');

async function createOrder(req, res) {
  const { items, subtotal, iva, total } = req.body;
  try {
    const order = await paypalService.createOrder(items, subtotal, iva, total);
    return res.json({ ok: true, orderID: order.id });
  } catch (err) {
    console.error('Error en createOrder PayPal:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al conectar con PayPal' });
  }
}

async function captureOrder(req, res) {
  const { orderId, items, subtotal, iva, total } = req.body;
  const { id: usuario_id }                       = req.usuario;

  let capture;
  try {
    capture = await paypalService.captureOrder(orderId);
  } catch (err) {
    console.error('Error al capturar pago PayPal:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al conectar con PayPal' });
  }

  if (capture.status !== 'COMPLETED') {
    return res.status(400).json({ ok: false, mensaje: 'Pago no completado' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (usuario_id, status, subtotal, iva, total, paypal_order_id, paypal_status)
       VALUES ($1, 'COMPLETADO', $2, $3, $4, $5, $6)
       RETURNING id`,
      [usuario_id, subtotal, iva, total, orderId, capture.status]
    );
    const pedidoId = pedidoResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pedidoId, item.producto_id, item.nombre, item.precio, item.cantidad, item.subtotal]
      );
      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );
    }

    await client.query('UPDATE productos SET en_stock = false WHERE stock = 0');
    await client.query('DELETE FROM carrito WHERE usuario_id = $1', [usuario_id]);

    await client.query('COMMIT');

    const payerEmail = capture.payer?.email_address;
    const amount     = capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount;

    return res.json({ ok: true, status: 'COMPLETED', pedidoId, payerEmail, amount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al registrar pedido PayPal:', err);
    return res.status(500).json({ ok: false, mensaje: 'Pago recibido pero error al registrar el pedido' });
  } finally {
    client.release();
  }
}

module.exports = { createOrder, captureOrder };
