const pool = require('../config/db');

async function crearPedido(req, res) {
  const { id: usuario_id } = req.usuario;
  const { items, subtotal, iva, total, paypal_order_id, paypal_status } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (usuario_id, subtotal, iva, total, paypal_order_id, paypal_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [usuario_id, subtotal, iva, total, paypal_order_id, paypal_status]
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

    await client.query(
      'UPDATE productos SET en_stock = false WHERE stock = 0'
    );

    await client.query(
      'DELETE FROM carrito WHERE usuario_id = $1',
      [usuario_id]
    );

    await client.query('COMMIT');

    return res.status(201).json({ ok: true, pedidoId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear pedido:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear el pedido' });
  } finally {
    client.release();
  }
}

async function getPedidos(req, res) {
  const { id: usuario_id } = req.usuario;

  const result = await pool.query(
    `SELECT p.id, p.status, p.subtotal, p.iva, p.total, p.paypal_order_id, p.created_at,
       json_agg(
         json_build_object(
           'producto_id', pi.producto_id,
           'nombre',      pi.nombre,
           'precio',      pi.precio,
           'cantidad',    pi.cantidad,
           'subtotal',    pi.subtotal
         ) ORDER BY pi.id
       ) AS items
     FROM pedidos p
     JOIN pedido_items pi ON pi.pedido_id = p.id
     WHERE p.usuario_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [usuario_id]
  );

  return res.json({ ok: true, datos: result.rows });
}

async function cancelarPedido(req, res) {
  const { id: usuario_id } = req.usuario;
  const pedido_id          = parseInt(req.params.id);

  const pedidoResult = await pool.query(
    'SELECT * FROM pedidos WHERE id = $1 AND usuario_id = $2',
    [pedido_id, usuario_id]
  );

  if (pedidoResult.rows.length === 0) {
    return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
  }

  if (pedidoResult.rows[0].status !== 'CREADO') {
    return res.status(400).json({ ok: false, mensaje: 'Solo se pueden cancelar pedidos en estado CREADO' });
  }

  const itemsResult = await pool.query(
    'SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = $1',
    [pedido_id]
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      "UPDATE pedidos SET status = 'CANCELADO', updated_at = NOW() WHERE id = $1",
      [pedido_id]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        'UPDATE productos SET stock = stock + $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );
    }

    await client.query(
      'UPDATE productos SET en_stock = true WHERE stock > 0'
    );

    await client.query('COMMIT');

    return res.json({ ok: true, mensaje: 'Pedido cancelado correctamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al cancelar pedido:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al cancelar el pedido' });
  } finally {
    client.release();
  }
}

module.exports = { crearPedido, getPedidos, cancelarPedido };
