const pool = require('../config/db');

async function getUsuarios(req, res) {
  const result = await pool.query(
    'SELECT id, nombre, email, rol, terminos_aceptados, created_at FROM usuarios ORDER BY created_at DESC'
  );
  return res.json({ ok: true, datos: result.rows });
}

async function getProductos(req, res) {
  const result = await pool.query('SELECT * FROM productos ORDER BY id');
  return res.json({ ok: true, datos: result.rows });
}

async function updateProducto(req, res) {
  const id = parseInt(req.params.id);
  const { nombre, precio, stock, descripcion } = req.body;

  if (precio <= 0) {
    return res.status(400).json({ ok: false, mensaje: 'El precio debe ser mayor a 0' });
  }
  if (stock < 0) {
    return res.status(400).json({ ok: false, mensaje: 'El stock no puede ser negativo' });
  }

  await pool.query(
    `UPDATE productos
     SET nombre=$1, precio=$2, stock=$3, descripcion=$4,
         en_stock=(stock > 0), updated_at=NOW()
     WHERE id=$5`,
    [nombre, precio, stock, descripcion, id]
  );

  return res.json({ ok: true, mensaje: 'Producto actualizado' });
}

async function toggleStock(req, res) {
  const id = parseInt(req.params.id);
  const { en_stock } = req.body;

  if (!en_stock) {
    await pool.query('UPDATE productos SET en_stock=false WHERE id=$1', [id]);
    return res.json({ ok: true, mensaje: 'Stock actualizado' });
  }

  const result = await pool.query('SELECT stock FROM productos WHERE id=$1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
  }

  if (result.rows[0].stock === 0) {
    return res.status(400).json({ ok: false, mensaje: 'No puedes activar un producto sin stock' });
  }

  await pool.query('UPDATE productos SET en_stock=true WHERE id=$1', [id]);
  return res.json({ ok: true, mensaje: 'Stock actualizado' });
}

async function crearProducto(req, res) {
  const { nombre, precio, stock, descripcion, categoria, image_url } = req.body;

  if (!nombre || !categoria) {
    return res.status(400).json({ ok: false, mensaje: 'nombre y categoria son requeridos' });
  }
  if (!precio || Number(precio) <= 0) {
    return res.status(400).json({ ok: false, mensaje: 'El precio debe ser mayor a 0' });
  }
  if (stock === undefined || Number(stock) < 0) {
    return res.status(400).json({ ok: false, mensaje: 'El stock no puede ser negativo' });
  }

  const en_stock = Number(stock) > 0;
  const result   = await pool.query(
    `INSERT INTO productos (nombre, precio, stock, descripcion, categoria, image_url, en_stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [nombre, Number(precio), Number(stock), descripcion ?? '', categoria, image_url ?? '', en_stock]
  );

  return res.status(201).json({ ok: true, datos: result.rows[0] });
}

module.exports = { getUsuarios, getProductos, updateProducto, toggleStock, crearProducto };
