const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario   = { id: decoded.id, nombre: decoded.nombre, email: decoded.email, rol: decoded.rol };
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido' });
  }
}

function adminOnly(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ ok: false, mensaje: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = { verifyToken, adminOnly };
