import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { data, signature } = req.body;

    const private_key = process.env.LIQPAY_PRIVATE_KEY;

    const expectedSignature = crypto
        .createHash('sha1')
        .update(private_key + data + private_key)
        .digest('base64');

    if (signature !== expectedSignature) {
        return res.status(403).json({ error: 'Invalid signature' });
    }

    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    const { status, err_description, order_id } = decodedData;

    if (status === 'error') {
        console.error(` Помилка платежу для замовлення ${order_id}: ${err_description}`);

    } else if (status === 'success') {
        console.log(`Успішний платіж для замовлення ${order_id}`);
    
    } else {
        console.log(`Статус платежу для замовлення ${order_id}: ${status}`);
    }
    
    res.status(200).json({ message: 'Callback processed' });
}
