const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendXMLRecibo(destinatario, pedido, xmlContent) {
  const fecha = new Date().toLocaleDateString('es-MX', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric'
  });

  const totalMatch = xmlContent.match(/<total>([\d.]+)<\/total>/);
  const totalStr   = totalMatch ? totalMatch[1] : (pedido.total || '0');
  const total      = Number(totalStr).toFixed(2);

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      destinatario,
    subject: `Tu recibo de compra - Loncho #${pedido.id}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d0d0d;color:#eeeeee;border-radius:12px;overflow:hidden;">
        <div style="background:#e63030;padding:24px 32px;">
          <h1 style="margin:0;font-size:1.4rem;letter-spacing:0.1em;color:#fff;">LONCHO</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">Recibo de compra</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="color:#aaa;font-size:0.9rem;margin:0 0 8px;">Pedido confirmado</p>
          <h2 style="margin:0 0 20px;font-size:1.2rem;color:#fff;">Orden #${pedido.id}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
            <tr>
              <td style="padding:8px 0;color:#888;border-bottom:1px solid #222;">Fecha</td>
              <td style="padding:8px 0;color:#eee;text-align:right;border-bottom:1px solid #222;">${fecha}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888;border-bottom:1px solid #222;">Total pagado</td>
              <td style="padding:8px 0;color:#fff;font-weight:700;text-align:right;border-bottom:1px solid #222;">MX$${total}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888;">Estado</td>
              <td style="padding:8px 0;color:#22c55e;font-weight:600;text-align:right;">COMPLETADO</td>
            </tr>
          </table>
          <p style="margin:24px 0 0;color:#666;font-size:0.8rem;">
            Adjunto encontrarás el recibo en formato XML. Consérvalo como comprobante de tu compra.
          </p>
        </div>
        <div style="padding:16px 32px;background:#111;text-align:center;">
          <p style="margin:0;color:#555;font-size:0.75rem;">© 2025 Loncho Streetwear · Ciudad de México</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename:    `recibo-loncho-${pedido.id}.xml`,
        content:     xmlContent,
        contentType: 'application/xml'
      }
    ]
  });
}

async function sendVerificacionEmail(email, nombre, token) {
  const link = `http://localhost:3000/api/auth/verificar?token=${token}`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: 'Verifica tu cuenta - Loncho',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d0d0d;color:#eeeeee;border-radius:12px;overflow:hidden;">
        <div style="background:#e63030;padding:24px 32px;">
          <h1 style="margin:0;font-size:1.4rem;letter-spacing:0.1em;color:#fff;">LONCHO</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">Verifica tu cuenta</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:1rem;color:#eee;margin:0 0 12px;">Hola <strong>${nombre}</strong>,</p>
          <p style="font-size:0.95rem;color:#bbb;margin:0 0 28px;">
            Gracias por registrarte en Loncho. Haz click en el botón para verificar tu cuenta y comenzar a comprar.
          </p>
          <div style="text-align:center;margin:0 0 28px;">
            <a href="${link}"
               style="display:inline-block;padding:14px 36px;background:#e63030;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;letter-spacing:0.05em;">
              Verificar mi cuenta
            </a>
          </div>
          <p style="font-size:0.8rem;color:#555;margin:0;">
            Si no creaste una cuenta en Loncho, ignora este mensaje.
          </p>
        </div>
        <div style="padding:16px 32px;background:#111;text-align:center;">
          <p style="margin:0;color:#555;font-size:0.75rem;">© 2025 Loncho Streetwear · Ciudad de México</p>
        </div>
      </div>
    `
  });
}

module.exports = { sendXMLRecibo, sendVerificacionEmail };
