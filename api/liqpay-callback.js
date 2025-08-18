import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    const private_key = process.env.LIQPAY_PRIVATE_KEY;
    const expectedSignature = crypto
        .createHash('sha1')
        .update(private_key + data + private_key)
        .digest('base64');

    if (signature !== expectedSignature) {
        console.error('Invalid signature');
        return res.status(403).json({ error: 'Invalid signature' });
    }

    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    const { status, err_description, order_id } = decodedData;

    if (status === 'error') {
        console.error(`❌ Помилка платежу для замовлення ${order_id}: ${err_description}`);
    } else if (status === 'success') {
        console.log(`✅ Успішний платіж для замовлення ${order_id}`);
    } else {
        console.log(`ℹ️ Статус платежу для замовлення ${order_id}: ${status}`);
    }

    res.status(200).json({ message: 'Callback processed' });
}
