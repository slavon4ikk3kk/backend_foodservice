// pages/api/check-payment.js

import LiqPay from 'liqpay';

export default async function handler(req, res) {
  // ⛔ Дозволяємо лише GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  const { order_id } = req.query;

  // ❗ Перевірка на наявність order_id
  if (!order_id) {
    return res.status(400).json({ error: 'Не передано order_id' });
  }

  // 🔐 Отримуємо ключі з env
  const public_key = process.env.LIQPAY_PUBLIC_KEY;
  const private_key = process.env.LIQPAY_PRIVATE_KEY;

  if (!public_key || !private_key) {
    return res.status(500).json({ error: 'Не задано LiqPay ключі у .env' });
  }

  // 🔄 Ініціалізація SDK
  const liqpay = new LiqPay(public_key, private_key);

  try {
    // 📡 Запит до API LiqPay
    liqpay.api(
      'request',
      {
        action: 'status',
        version: '3',
        order_id,
      },
      function (json) {
        // 🔎 Можеш логувати
        console.log('LiqPay status response:', json);

        // 📦 Повертаємо JSON-відповідь
        res.status(200).json({
          status: json.status,
          amount: json.amount,
          currency: json.currency,
          err_description: json.err_description || null,
          order_id: json.order_id,
        });
      }
    );
  } catch (err) {
    console.error('LiqPay status error:', err);
    res.status(500).json({ error: 'Помилка при запиті до LiqPay' });
  }
}
