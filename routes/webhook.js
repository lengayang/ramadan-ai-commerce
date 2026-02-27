const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", (req, res) => {

  const payload = req.body;

  // Cek status sukses dari Mayar
  if (payload && payload.status === "SUCCESS") {

    const amount = Number(payload.amount || 0);

    // Misal margin 20%
    const basePrice = Math.round(amount / 1.2);
    const profit = amount - basePrice;

    const logData = {
      timestamp: new Date().toISOString(),
      amount,
      profit
    };

    const logPath = path.join(__dirname, "../transactions.log");

    fs.appendFileSync(logPath, JSON.stringify(logData) + "\n");

    console.log("💰 Transaction logged:", logData);
  }

  res.json({ received: true });
});

module.exports = router;
