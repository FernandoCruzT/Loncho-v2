require('dotenv').config();
const axios = require('axios');

const PAYPAL_API_URL = process.env.PAYPAL_API_URL;

async function getAccessToken() {
  try {
    const res = await axios.post(
      `${PAYPAL_API_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth:    { username: process.env.PAYPAL_CLIENT_ID, password: process.env.PAYPAL_CLIENT_SECRET },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      }
    );
    return res.data.access_token;
  } catch (err) {
    throw new Error('Error al conectar con PayPal');
  }
}

async function createOrder(items, subtotal, iva, total) {
  const accessToken = await getAccessToken();
  try {
    const res = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders`,
      {
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
      },
      {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return res.data;
  } catch (err) {
    throw new Error('Error al conectar con PayPal');
  }
}

async function captureOrder(orderId) {
  const accessToken = await getAccessToken();
  try {
    const res = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    return res.data;
  } catch (err) {
    throw new Error('Error al conectar con PayPal');
  }
}

module.exports = { getAccessToken, createOrder, captureOrder };
