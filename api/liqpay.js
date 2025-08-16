import crypto from "crypto";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");


  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { amount, description } = req.query;

  const public_key = process.env.LIQPAY_PUBLIC_KEY;
  const private_key = process.env.LIQPAY_PRIVATE_KEY;

  const order_id = "order_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

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

  res.status(200).json({ data: base64Data, signature, order_id });
}