const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');

const SALT_ROUNDS = 10;

function signToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res) {
  const { nombre, email, password, terminos_aceptados } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ ok: false, mensaje: 'nombre, email y password son requeridos' });
  }

  if (terminos_aceptados !== true) {
    return res.status(400).json({ ok: false, mensaje: 'Debes aceptar los términos y condiciones' });
  }

  const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (existe.rows.length > 0) {
    return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    'INSERT INTO usuarios (nombre, email, password, terminos_aceptados) VALUES ($1, $2, $3, true) RETURNING id, nombre, email, rol',
    [nombre, email, hash]
  );

  const usuario = result.rows[0];
  const token   = signToken(usuario);

  return res.status(201).json({ ok: true, token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
}

async function login(req, res) {
  const { email, password } = req.body;

  const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
  }

  const usuario  = result.rows[0];
  const coincide = await bcrypt.compare(password, usuario.password);

  if (!coincide) {
    return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
  }

  const { id, nombre, rol } = usuario;
  const token = signToken({ id, nombre, email, rol });

  return res.json({ ok: true, token, usuario: { id, nombre, email, rol } });
}

async function updatePerfil(req, res) {
  const { id } = req.usuario;
  const { nombre, passwordActual, passwordNueva } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ ok: false, mensaje: 'El nombre es requerido' });
  }

  const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
  }

  const usuario = result.rows[0];

  if (passwordNueva) {
    if (!passwordActual) {
      return res.status(400).json({ ok: false, mensaje: 'Debes ingresar tu contraseña actual' });
    }
    const coincide = await bcrypt.compare(passwordActual, usuario.password);
    if (!coincide) {
      return res.status(400).json({ ok: false, mensaje: 'Contraseña actual incorrecta' });
    }
    const hash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
    await pool.query(
      'UPDATE usuarios SET nombre=$1, password=$2 WHERE id=$3',
      [nombre.trim(), hash, id]
    );
  } else {
    await pool.query('UPDATE usuarios SET nombre=$1 WHERE id=$2', [nombre.trim(), id]);
  }

  const updated = await pool.query(
    'SELECT id, nombre, email, rol FROM usuarios WHERE id=$1', [id]
  );
  const u = updated.rows[0];
  return res.json({ ok: true, mensaje: 'Perfil actualizado', usuario: u });
}

module.exports = { register, login, updatePerfil };
