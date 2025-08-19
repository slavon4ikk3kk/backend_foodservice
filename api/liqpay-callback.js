import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // LiqPay може надсилати великі payload'и
    },
  },
};

const PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { data, signature } = req.body;

  if (!data || !signature) {
    return res.status(400).json({ error: 'Missing data or signature' });
  }

  // Підпис: base64(sha1(private_key + data + private_key))
  const expectedSignature = crypto
    .createHash('sha1')
    .update(PRIVATE_KEY + data + PRIVATE_KEY)
    .digest('base64');

  if (signature !== expectedSignature) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  let decodedData;
  try {
    const jsonString = Buffer.from(data, 'base64').toString('utf-8');
    decodedData = JSON.parse(jsonString);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  // TODO: тут ти можеш зберегти decodedData у базу або обробити як треба
  console.log('✅ LiqPay payment received:', decodedData);

  // Обов'язково відповісти 200 OK, інакше LiqPay буде повторно надсилати запити
  res.status(200).end('OK');
}
