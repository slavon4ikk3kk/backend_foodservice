import crypto from "crypto";

export default function handler(req, res) {
  const { amount, description } = req.query;

  const public_key = process.env.LIQPAY_PUBLIC_KEY;
  const private_key = process.env.LIQPAY_PRIVATE_KEY;

  // тут завжди унікальний order_id
  const order_id = "order_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

  const payload = {
    public_key,
    version: 3,
    action: "pay",
    amount,
    currency: "UAH",
    description,
    order_id,
    sandbox: 1
  };

  const base64Data = Buffer.from(JSON.stringify(payload)).toString("base64");

  const signature = crypto
    .createHash("sha1")
    .update(private_key + base64Data + private_key)
    .digest("base64");

  res.status(200).json({ data: base64Data, signature });
}