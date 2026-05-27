require('dotenv').config();

const PAYPAL_API_URL = process.env.PAYPAL_API_URL;

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  return data.access_token;
}

async function createOrder(items, subtotal, iva, total) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'MXN',
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: 'MXN', value: subtotal.toFixed(2) },
              tax_total:  { currency_code: 'MXN', value: iva.toFixed(2) },
            },
          },
          items: items.map(item => ({
            name:        item.nombre,
            quantity:    String(item.cantidad),
            unit_amount: { currency_code: 'MXN', value: Number(item.precio).toFixed(2) },
          })),
        },
      ],
    }),
  });

  return res.json();
}

async function captureOrder(orderId) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return res.json();
}

module.exports = { getAccessToken, createOrder, captureOrder };
