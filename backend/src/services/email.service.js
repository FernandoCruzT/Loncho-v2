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

  const totalMatch    = xmlContent.match(/<total>([\d.]+)<\/total>/);
  const subtotalMatch = xmlContent.match(/<subtotal>([\d.]+)<\/subtotal>/);
  const ivaMatch      = xmlContent.match(/<iva>([\d.]+)<\/iva>/);
  const total    = Number(totalMatch    ? totalMatch[1]    : (pedido.total || '0')).toFixed(2);
  const subtotal = Number(subtotalMatch ? subtotalMatch[1] : '0').toFixed(2);
  const iva      = Number(ivaMatch      ? ivaMatch[1]      : '0').toFixed(2);

  const productosHTML = (() => {
    const matches = [...xmlContent.matchAll(/<producto>([\s\S]*?)<\/producto>/g)];
    if (!matches.length) return '<tr><td colspan="3" style="color:#666;text-align:center;">Sin detalle de productos</td></tr>';
    return matches.map(m => {
      const nombre   = m[1].match(/<nombre>(.*?)<\/nombre>/)?.[1]     ?? '';
      const cantidad = m[1].match(/<cantidad>(.*?)<\/cantidad>/)?.[1]  ?? '';
      const subtotal = m[1].match(/<subtotal>([\d.]+)<\/subtotal>/)?.[1] ?? '0';
      return `
      <tr>
        <td style="padding:8px 0;color:#eee;border-bottom:1px solid #222;">${nombre}</td>
        <td style="padding:8px 0;color:#aaa;text-align:center;border-bottom:1px solid #222;">${cantidad}</td>
        <td style="padding:8px 0;color:#fff;text-align:right;border-bottom:1px solid #222;">MX$${Number(subtotal).toFixed(2)}</td>
      </tr>`;
    }).join('');
  })();

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
              <td style="padding:8px 0;color:#888;border-bottom:1px solid #222;">Subtotal</td>
              <td style="padding:8px 0;color:#eee;text-align:right;border-bottom:1px solid #222;">MX$${subtotal}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888;border-bottom:1px solid #222;">IVA (16%)</td>
              <td style="padding:8px 0;color:#eee;text-align:right;border-bottom:1px solid #222;">MX$${iva}</td>
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

          <p style="color:#aaa;font-size:0.85rem;margin:20px 0 8px;font-weight:600;letter-spacing:0.05em;">PRODUCTOS</p>
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
            <thead>
              <tr>
                <th style="padding:6px 0;color:#666;text-align:left;border-bottom:1px solid #333;font-weight:600;">Producto</th>
                <th style="padding:6px 0;color:#666;text-align:center;border-bottom:1px solid #333;font-weight:600;">Cant.</th>
                <th style="padding:6px 0;color:#666;text-align:right;border-bottom:1px solid #333;font-weight:600;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${productosHTML}</tbody>
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
  const link = `${process.env.BASE_URL}/api/auth/verificar?token=${token}`;

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

async function sendCodigoVerificacion(email, nombre, codigo) {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: 'Tu código de verificación - Loncho',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d0d0d;color:#eeeeee;border-radius:12px;overflow:hidden;">
        <div style="background:#e63030;padding:24px 32px;">
          <h1 style="margin:0;font-size:1.4rem;letter-spacing:0.1em;color:#fff;">LONCHO</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">Verificación de cuenta</p>
        </div>
        <div style="padding:32px;text-align:center;">
          <p style="font-size:1rem;color:#eee;margin:0 0 8px;text-align:left;">Hola <strong>${nombre}</strong>,</p>
          <p style="font-size:0.95rem;color:#bbb;margin:0 0 28px;text-align:left;">Tu código de verificación es:</p>
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;margin:0 0 20px;">
            <span style="font-size:2.5rem;font-weight:900;color:#e63030;letter-spacing:0.4rem;">${codigo}</span>
          </div>
          <p style="font-size:0.85rem;color:#666;margin:0;">Este código expira en 6 minutos.</p>
        </div>
        <div style="padding:16px 32px;background:#111;text-align:center;">
          <p style="margin:0;color:#555;font-size:0.75rem;">© 2025 Loncho Streetwear · Ciudad de México</p>
        </div>
      </div>
    `
  });
}

async function sendResetCodigo(email, nombre, codigo) {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: 'Recupera tu contraseña - Loncho',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d0d0d;color:#eeeeee;border-radius:12px;overflow:hidden;">
        <div style="background:#e63030;padding:24px 32px;">
          <h1 style="margin:0;font-size:1.4rem;letter-spacing:0.1em;color:#fff;">LONCHO</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">Recuperación de contraseña</p>
        </div>
        <div style="padding:32px;text-align:center;">
          <p style="font-size:1rem;color:#eee;margin:0 0 8px;text-align:left;">Hola <strong>${nombre}</strong>,</p>
          <p style="font-size:0.95rem;color:#bbb;margin:0 0 28px;text-align:left;">
            Recibiste este correo porque solicitaste restablecer tu contraseña en Loncho. Tu código es:
          </p>
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;margin:0 0 20px;">
            <span style="font-size:2.5rem;font-weight:900;color:#e63030;letter-spacing:0.4rem;">${codigo}</span>
          </div>
          <p style="font-size:0.85rem;color:#666;margin:0;">
            Este código expira en 6 minutos. Si no solicitaste esto, ignora este mensaje.
          </p>
        </div>
        <div style="padding:16px 32px;background:#111;text-align:center;">
          <p style="margin:0;color:#555;font-size:0.75rem;">© 2025 Loncho Streetwear · Ciudad de México</p>
        </div>
      </div>
    `
  });
}

module.exports = { sendXMLRecibo, sendVerificacionEmail, sendCodigoVerificacion, sendResetCodigo };
