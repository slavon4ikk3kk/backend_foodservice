import crypto from 'crypto';

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    

    const public_key = process.env.LIQPAY_PUBLIC_KEY;
    const private_key = process.env.LIQPAY_PRIVATE_KEY;

    const { amount, description, order_id } = req.query;

    const data = {
        public_key,
        version: 3,
        action: 'pay',
        amount,
        currency: 'UAH',
        description,
        order_id,
        result_url: "https://localhost:3000/", // куди повернеться користувач
        server_url: "https://backend-foodservice.vercel.app/api/liqpay-callback",
    };

    const jsonString = JSON.stringify(data);
    const base64Data = Buffer.from(jsonString).toString('base64');
    const signature = crypto
        .createHash('sha1')
        .update(private_key + base64Data + private_key)
        .digest('base64');

    res.status(200).json({ data: base64Data, signature });
}
