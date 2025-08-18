// pages/api/liqpay-callback.js

import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false, // потрібен для обробки form-urlencoded
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Зчитування "сирого" тіла запиту
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const rawBody = Buffer.concat(buffers).toString('utf-8');

  // Парсимо form-urlencoded (data=...&signature=...)
  const params = new URLSearchParams(rawBody);
  const data = params.get('data');
  const signature = params.get('signature');

  if (!data || !signature) {
    console.error('❌ Не знайдено data або signature');
    return res.status(400).json({ error: 'Invalid request' });
  }

  // Перевірка підпису
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;

  const expectedSignature = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');

  if (signature !== expectedSignature) {
    console.error('❌ Підпис не збігається');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Розкодування та обробка data
  const decodedData = JSON.parse(
    Buffer.from(data, 'base64').toString('utf-8')
  );

  const { status, order_id, err_description } = decodedData;

  // Обробка статусу
  if (status === 'success') {
    console.log(`✅ Успішний платіж: ${order_id}`);
    // TODO: оновити замовлення в базі даних
  } else if (status === 'error') {
    console.error(`❌ Помилка для ${order_id}: ${err_description}`);
    // TODO: записати в лог/базу
  } else {
    console.log(`ℹ️ Статус для ${order_id}: ${status}`);
  }

  return res.status(200).json({ message: 'Callback processed' });
}
