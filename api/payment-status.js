
import { paymentStatuses } from './liqpay-callback';

export default function handler(req, res) {
  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: 'Не вказано order_id' });
  }

  const payment = paymentStatuses.get(order_id);

  if (!payment) {
    return res.status(404).json({ error: 'Статус не знайдено' });
  }

  return res.status(200).json({ order_id, ...payment });
}
