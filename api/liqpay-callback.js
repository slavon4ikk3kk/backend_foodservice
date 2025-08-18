// pages/api/liqpay-callback.js

import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Тимчасове збереження статусів у пам’яті (RAM)
const paymentStatuses = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const rawBody = Buffer.concat(buffers).toString('utf-8');

  const params = new URLSearchParams(rawBody);
  const data = params.get('data');
  const signature = params.get('signature');

  if (!data || !signature) {
    console.error('❌ Не знайдено data або signature');
    return res.status(400).json({ error: 'Invalid request' });
  }

  const privateKey = process.env.LIQPAY_PRIVATE_KEY;

  const expectedSignature = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');

  if (signature !== expectedSignature) {
    console.error('❌ Підпис не збігається');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
  const { status, order_id, err_description } = decodedData;

  
  paymentStatuses.set(order_id, {
    status,
    message: status === 'success' ? 'Платіж успішний' : err_description || 'Невідомий статус',
  });

  if (status === 'success') {
    console.log(`✅ Успішний платіж: ${order_id}`);
  } else if (status === 'error') {
    console.error(`❌ Помилка для ${order_id}: ${err_description}`);
  } else {
    console.log(`ℹ️ Статус для ${order_id}: ${status}`);
  }

  return res.status(200).json({ message: 'Callback processed' });
}


export { paymentStatuses };
