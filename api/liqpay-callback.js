// pages/api/check-payment.js
import LiqPay from 'liqpay';

export default function handler(req, res) {
  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  const liqpay = new LiqPay(
    process.env.LIQPAY_PUBLIC_KEY, 
    process.env.LIQPAY_PRIVATE_KEY
);

  liqpay.api("request", {
    "action": "status",
    "version": "3",
    "order_id": order_id
  }, function(json) {
    console.log(json); // 🔍 подивись у логах
    res.status(200).json(json);
  });
}
