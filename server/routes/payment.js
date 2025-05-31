const router = require("express").Router();
const Razorpay = require("razorpay");
require("dotenv").config();

const api_key = process.env.RAZORPAY_API_KEY;
const api_secret = process.env.RAZORPAY_SECRET;

const instance = new Razorpay({ key_id: api_key, key_secret: api_secret });

// Get Payment Key
router.get("/paymentKey", (req, res) => {
  try {
    res.status(200).json({ key: api_key });
  } catch (error) {
    console.error("Error fetching payment key:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Payment Order
router.post("/instance", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const options = { amount, currency: "INR" };
    const order = await instance.orders.create(options);
    res.status(200).json({ order });

  } catch (error) {
    console.error("Error creating payment order:", error.message);
    res.status(500).json({ error: "Payment order creation failed" });
  }
});

module.exports = router;
