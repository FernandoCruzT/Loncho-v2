const pool = require('../config/db');

const getProductos = async (req, res) => {
  try {
    const { categoria } = req.query;
    let query  = 'SELECT * FROM productos WHERE en_stock = true';
    const params = [];

    if (categoria) {
      query += ' AND categoria = $1';
      params.push(categoria);
    }

    query += ' ORDER BY id';

    const { rows } = await pool.query(query, params);
    res.json({ ok: true, datos: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener productos' });
  }
};

const getProductoById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }

    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    res.json({ ok: true, datos: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el producto' });
  }
};

module.exports = { getProductos, getProductoById };
