const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const crypto       = require('crypto');
const pool         = require('../config/db');
const emailService = require('../services/email.service');

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

  const hash              = await bcrypt.hash(password, SALT_ROUNDS);
  const tokenVerificacion = crypto.randomBytes(32).toString('hex');

  await pool.query(
    'INSERT INTO usuarios (nombre, email, password, terminos_aceptados, token_verificacion, email_verificado) VALUES ($1, $2, $3, true, $4, false)',
    [nombre, email, hash, tokenVerificacion]
  );

  await emailService.sendVerificacionEmail(email, nombre, tokenVerificacion);

  return res.status(201).json({
    ok: true,
    mensaje: 'Revisa tu correo para verificar tu cuenta',
    requiresVerification: true
  });
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

  if (!usuario.email_verificado) {
    return res.status(403).json({
      ok: false,
      mensaje: 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'
    });
  }

  const { id, nombre, rol } = usuario;
  const token = signToken({ id, nombre, email, rol });

  return res.json({ ok: true, token, usuario: { id, nombre, email, rol } });
}

async function verificarEmail(req, res) {
  const { token } = req.query;

  const result = await pool.query(
    'SELECT id, nombre, email, rol FROM usuarios WHERE token_verificacion = $1',
    [token]
  );

  if (result.rows.length === 0) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><title>Verificación - Loncho</title>
      <style>body{font-family:sans-serif;background:#0d0d0d;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
      .card{background:#1a1a1a;padding:40px;border-radius:12px;text-align:center;max-width:400px;}
      h2{color:#e63030;}a{color:#e63030;}</style></head>
      <body><div class="card">
        <h2>Token inválido o expirado</h2>
        <p>El enlace de verificación no es válido o ya fue usado.</p>
        <a href="http://localhost:4200/register">Volver al registro</a>
      </div></body></html>
    `);
  }

  const usuario = result.rows[0];
  await pool.query(
    'UPDATE usuarios SET email_verificado = true, token_verificacion = null WHERE id = $1',
    [usuario.id]
  );

  const jwtToken = signToken(usuario);

  return res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Cuenta verificada - Loncho</title>
    <style>body{font-family:sans-serif;background:#0d0d0d;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
    .card{background:#1a1a1a;padding:40px;border-radius:12px;text-align:center;max-width:400px;}
    h2{color:#22c55e;}
    .btn{display:inline-block;margin-top:20px;padding:12px 28px;background:#e63030;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;}</style></head>
    <body><div class="card">
      <h2>¡Cuenta verificada!</h2>
      <p>Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión en Loncho.</p>
      <a class="btn" href="http://localhost:4200/login">Ir al login</a>
    </div>
    <script>
      setTimeout(() => { window.location.href = 'http://localhost:4200/login'; }, 3000);
    </script>
    </body></html>
  `);
}

async function eliminarCuenta(req, res) {
  const { id } = req.usuario;
  await pool.query('DELETE FROM carrito WHERE usuario_id = $1', [id]);
  await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  return res.json({ ok: true, mensaje: 'Cuenta eliminada' });
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

module.exports = { register, login, verificarEmail, updatePerfil, eliminarCuenta };
