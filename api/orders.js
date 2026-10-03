// api/orders.js
import { db } from '../lib/db';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Настройка CORS для работы с вашего фронтенда
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1️⃣ КЛИК «ПІДТВЕРДИТИ»: СОХРАНЕНИЕ ЗАКАЗА В МYSQL
  if (req.method === 'POST') {
    try {
      const { name, address, phone, selectedPayment, totalCost, validMessage } = req.body;

      const query = `
        INSERT INTO orders (customer_name, address, phone, payment_method, total_cost, order_details, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const initialStatus = selectedPayment === 'Готівкою' ? 'PENDING_CASH' : 'NEW';

      const [result] = await db.execute(query, [
        name,
        address,
        phone,
        selectedPayment,
        totalCost,
        validMessage,
        initialStatus,
      ]);

      // result.insertId — автоинкрементный ID созданной записи в таблице orders
      return res.status(201).json({
        success: true,
        orderNumber: result.insertId,
      });
    } catch (error) {
      console.error('Помилка записи в MySQL:', error);
      return res.status(500).json({ message: 'Помилка збереження замовлення' });
    }
  }

  // 2️⃣ КЛИК «ОПЛАТИТИ»: ГЕНЕРАЦИЯ ПОДПИСИ ДЛЯ WAYFORPAY
  if (req.method === 'GET') {
    try {
      const { amount, order_id } = req.query;

      const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT;
      const secretKey = process.env.WAYFORPAY_SECRET_KEY;
      const domainName = process.env.WAYFORPAY_DOMAIN || 'kafe-dvorik.in.ua';

      const orderDate = Math.floor(Date.now() / 1000);
      const currency = 'UAH';
      const productName = `Замовлення №${order_id}`;
      const productPrice = String(amount);
      const productCount = '1';

      // Формирование строки параметров согласно документации WayForPay
      const stringToSign = [
        merchantAccount,
        domainName,
        order_id,
        orderDate,
        productPrice,
        currency,
        productName,
        productCount,
        productPrice,
      ].join(';');

      // Генерация HMAC-MD5 подписи
      const merchantSignature = crypto
        .createHmac('md5', secretKey)
        .update(stringToSign, 'utf8')
        .digest('hex');

      return res.status(200).json({
        merchantAccount,
        merchantDomainName: domainName,
        orderReference: String(order_id),
        orderDate,
        amount: productPrice,
        currency,
        productName: [productName],
        productPrice: [productPrice],
        productCount: [productCount],
        merchantSignature,
        serviceUrl: 'https://backend-foodservice.vercel.app/api/wayforpay-callback',
        returnUrl: 'https://kafe-dvorik.in.ua/',
      });
    } catch (error) {
      console.error('Помилка генерації підпису:', error);
      return res.status(500).json({ message: 'Помилка подписи' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}