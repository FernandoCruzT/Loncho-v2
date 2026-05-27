const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario   = { id: decoded.id, nombre: decoded.nombre, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido' });
  }
}

module.exports = { verifyToken };
