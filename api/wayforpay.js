import crypto from 'crypto';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ключи WayForPay из переменных окружения Vercel
  const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT; // Название/логин мерчанта
  const secretKey = process.env.WAYFORPAY_SECRET_KEY;             // Секретный ключ
  const domainName = "https://kafe-dvorik.in.ua/";

  const { amount, description, order_id } = req.query;

  const orderDate = Math.floor(Date.now() / 1000);
  const currency = 'UAH';
  const productName = description || 'Оплата за товар';
  const productPrice = String(amount);
  const productCount = '1';

  // 1. Формируем массив значений для цифровой подписи (порядок строго регламентирован WayForPay)
  const fieldsForSignature = [
    merchantAccount,
    domainName,
    order_id,
    orderDate,
    productPrice,
    currency,
    productName,
    productCount,
    productPrice
  ];

  // 2. Объединяем значения через разделитель ';'
  const stringToSign = fieldsForSignature.join(';');

  // 3. Создаем подпись HMAC-MD5 (или HMAC-SHA256, в зависимости от настроек мерчанта, по умолчанию HMAC-MD5)
  const merchantSignature = crypto
    .createHmac('md5', secretKey)
    .update(stringToSign, 'utf8')
    .digest('hex');

  // 4. Возвращаем объект данных, который напрямую передается в wayforpay.run(...)
  res.status(200).json({
    merchantAccount,
    merchantDomainName: domainName,
    orderReference: order_id,
    orderDate,
    amount: productPrice,
    currency,
    productName: [productName],
    productPrice: [productPrice],
    productCount: [productCount],
    merchantSignature,
    serviceUrl: 'https://backend-foodservice.vercel.app/api/wayforpay-callback', // Webhook для статуса оплаты
    returnUrl: 'https://kafe-dvorik.in.ua/'
  });
}