const pool = require('../config/db');

async function getCarrito(req, res) {
  const { id: usuario_id } = req.usuario;

  const result = await pool.query(
    `SELECT c.producto_id, p.nombre, p.precio, p.stock, p.image_url, c.cantidad
     FROM carrito c
     JOIN productos p ON p.id = c.producto_id
     WHERE c.usuario_id = $1
     ORDER BY c.created_at ASC`,
    [usuario_id]
  );

  return res.json({ ok: true, datos: result.rows });
}

async function agregarItem(req, res) {
  const { id: usuario_id }        = req.usuario;
  const { producto_id, cantidad } = req.body;

  if (!producto_id || !cantidad || cantidad < 1) {
    return res.status(400).json({ ok: false, mensaje: 'producto_id y cantidad (>= 1) son requeridos' });
  }

  const prod = await pool.query('SELECT stock FROM productos WHERE id = $1', [producto_id]);
  if (prod.rows.length === 0) {
    return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
  }

  if (cantidad > prod.rows[0].stock) {
    return res.status(400).json({ ok: false, mensaje: `Stock insuficiente. Disponible: ${prod.rows[0].stock}` });
  }

  await pool.query(
    `INSERT INTO carrito (usuario_id, producto_id, cantidad)
     VALUES ($1, $2, $3)
     ON CONFLICT (usuario_id, producto_id) DO UPDATE
       SET cantidad   = $3,
           updated_at = NOW()`,
    [usuario_id, producto_id, cantidad]
  );

  return res.json({ ok: true, mensaje: 'Producto agregado al carrito' });
}

async function actualizarCantidad(req, res) {
  const { id: usuario_id }  = req.usuario;
  const { producto_id }     = req.params;
  const { cantidad }        = req.body;

  if (!cantidad || cantidad < 1) {
    return res.status(400).json({ ok: false, mensaje: 'cantidad debe ser >= 1' });
  }

  const prod = await pool.query('SELECT stock FROM productos WHERE id = $1', [producto_id]);
  if (prod.rows.length === 0) {
    return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
  }

  if (cantidad > prod.rows[0].stock) {
    return res.status(400).json({ ok: false, mensaje: `Stock insuficiente. Disponible: ${prod.rows[0].stock}` });
  }

  await pool.query(
    `UPDATE carrito SET cantidad = $1, updated_at = NOW()
     WHERE usuario_id = $2 AND producto_id = $3`,
    [cantidad, usuario_id, producto_id]
  );

  return res.json({ ok: true, mensaje: 'Cantidad actualizada' });
}

async function eliminarItem(req, res) {
  const { id: usuario_id } = req.usuario;
  const { producto_id }    = req.params;

  await pool.query(
    'DELETE FROM carrito WHERE usuario_id = $1 AND producto_id = $2',
    [usuario_id, producto_id]
  );

  return res.json({ ok: true, mensaje: 'Producto eliminado del carrito' });
}

async function vaciarCarrito(req, res) {
  const { id: usuario_id } = req.usuario;

  await pool.query('DELETE FROM carrito WHERE usuario_id = $1', [usuario_id]);

  return res.json({ ok: true, mensaje: 'Carrito vaciado' });
}

module.exports = { getCarrito, agregarItem, actualizarCantidad, eliminarItem, vaciarCarrito };
