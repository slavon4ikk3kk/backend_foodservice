import crypto from 'crypto';

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { amount, description } = req.query;

    const public_key = process.env.LIQPAY_PUBLIC_KEY;
    const private_key = process.env.LIQPAY_PRIVATE_KEY;

    const order_id = `order_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    const data = {
        public_key,
        version: 3,
        action: 'pay',
        amount,
        currency: 'UAH',
        description,
        order_id,
        result_url: "http://localhost:3000/",
        sandbox: 1, // 1 = тестовий режим, 0 = бойовий
    };

    const jsonString = JSON.stringify(data);
    const base64Data = Buffer.from(jsonString).toString('base64');

    // 🔧 Ось правильна генерація підпису:
    const sha1 = crypto.createHash('sha1');
    sha1.update(private_key + base64Data + private_key, 'utf-8');
    const binarySignature = sha1.digest(); // це Buffer
    const signature = Buffer.from(binarySignature).toString('base64');

    res.status(200).json({ data: base64Data, signature });
}
