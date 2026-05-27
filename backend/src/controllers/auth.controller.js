const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');

const SALT_ROUNDS = 10;

function signToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res) {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ ok: false, mensaje: 'nombre, email y password son requeridos' });
  }

  const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (existe.rows.length > 0) {
    return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id, nombre, email',
    [nombre, email, hash]
  );

  const usuario = result.rows[0];
  const token   = signToken(usuario);

  return res.status(201).json({ ok: true, token, usuario });
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

  const { id, nombre } = usuario;
  const token = signToken({ id, nombre, email });

  return res.json({ ok: true, token, usuario: { id, nombre, email } });
}

module.exports = { register, login };
