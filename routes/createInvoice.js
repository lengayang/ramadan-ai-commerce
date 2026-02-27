const express = require("express");
const router = express.Router();
const axios = require("axios");
const generateProduct = require("../llm-engine");

router.post("/", async (req, res) => {
  try {

    const { idea } = req.body;
    if (!idea) {
      return res.status(400).json({ error: "Idea is required" });
    }

    // ==============================
    // 1. AI Generate Product
    // ==============================
    const product = await generateProduct(idea);
    console.log("🤖 AI Generated:", product);

    const basePrice = Number(product.price);
    const finalPrice = Math.round(basePrice * 1.2);
    const margin = finalPrice - basePrice;

    // ==============================
    // 2. Create Payment Request
    // ==============================
    const response = await axios.post(
      "https://api.mayar.id/hl/v1/payment/create",
      {
        name: "Customer Ramadan",
        email: "customer@email.com",
        mobile: "08123456789",
        amount: finalPrice,
        redirectURL: "https://ramadan.masri.cloud/success.html",
        description: product.description,
        expiredAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MAYAR_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.data?.data?.link) {
      return res.status(500).json({
        error: "Invalid Mayar response",
        raw: response.data
      });
    }

    const checkoutUrl = response.data.data.link;

    const waLink = `https://wa.me/?text=${encodeURIComponent(
      `Produk Ramadan siap dipesan!\n\n${product.name}\nHarga: Rp ${finalPrice.toLocaleString()}\n\nBayar di: ${checkoutUrl}`
    )}`;

    res.json({
      product: {
        ...product,
        basePrice,
        finalPrice,
        margin
      },
      checkoutUrl,
      waLink
    });

  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Invoice creation failed" });
  }
});

module.exports = router;
