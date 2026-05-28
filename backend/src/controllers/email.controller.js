const emailService = require('../services/email.service');

async function enviarRecibo(req, res) {
  const { pedidoId, email, xmlContent } = req.body;

  if (!pedidoId || !email || !xmlContent) {
    return res.status(400).json({ ok: false, mensaje: 'pedidoId, email y xmlContent son requeridos' });
  }

  try {
    await emailService.sendXMLRecibo(email, { id: pedidoId }, xmlContent);
    return res.json({ ok: true, mensaje: `Recibo enviado a ${email}` });
  } catch (err) {
    console.error('Error al enviar correo:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error al enviar el correo' });
  }
}

module.exports = { enviarRecibo };
