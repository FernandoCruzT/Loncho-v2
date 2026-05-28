const express = require('express');
const cors    = require('cors');

const productosRoutes           = require('./routes/productos.routes');
const authRoutes                = require('./routes/auth.routes');
const carritoRoutes             = require('./routes/carrito.routes');
const pedidosRoutes             = require('./routes/pedidos.routes');
const paypalRoutes              = require('./routes/paypal.routes');
const adminRoutes               = require('./routes/admin.routes');
const emailRoutes               = require('./routes/email.routes');
const { verifyToken, adminOnly } = require('./middleware/auth.middleware');

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ mensaje: 'Loncho API funcionando', version: '1.0.0' });
});

app.use('/api/auth',      authRoutes);
app.use('/api/carrito',   verifyToken, carritoRoutes);
app.use('/api/pedidos',   verifyToken, pedidosRoutes);
app.use('/api/paypal',    verifyToken, paypalRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/admin',     verifyToken, adminOnly, adminRoutes);
app.use('/api/email',     verifyToken, emailRoutes);

app.use((_req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
});

module.exports = app;
