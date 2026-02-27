require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

const createInvoice = require("./routes/createInvoice");
const webhook = require("./routes/webhook");

const app = express();

// ======================
// Middleware
// ======================
app.use(express.json());
app.use(express.static("public"));

// ======================
// API Routes
// ======================
app.use("/api/create-invoice", createInvoice);

// ======================
// Webhook Security (QUERY TOKEN)
// ======================
app.use("/api/webhook", (req, res, next) => {
  const token = req.query.token;

  if (token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: "Unauthorized webhook" });
  }

  next();
});

app.use("/api/webhook", webhook);

// ======================
// Health Check
// ======================
app.get("/health", (req, res) => {
  res.json({ status: "Ramadan AI running 🚀" });
});

// ======================
// Logs Viewer
// ======================
app.get("/logs", (req, res) => {
  const logPath = path.join(__dirname, "transactions.log");

  if (!fs.existsSync(logPath)) {
    return res.send("<pre>Belum ada transaksi.</pre>");
  }

  try {
    const data = fs.readFileSync(logPath, "utf8");
    res.send(`<pre>${data}</pre>`);
  } catch (err) {
    console.error("Log read error:", err);
    res.status(500).send("Gagal membaca log.");
  }
});

// ======================
// Dashboard Analytics
// ======================
app.get("/dashboard", (req, res) => {

  const logPath = path.join(__dirname, "transactions.log");
  let logs = [];
  let demoMode = false;

  if (fs.existsSync(logPath)) {
    logs = fs.readFileSync(logPath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map(l => {
        try { return JSON.parse(l); }
        catch { return null; }
      })
      .filter(Boolean);
  }

  if (logs.length === 0) {
    demoMode = true;
    logs = [
      { amount: 120000, profit: 20000 },
      { amount: 240000, profit: 40000 },
      { amount: 360000, profit: 60000 },
      { amount: 480000, profit: 80000 }
    ];
  }

  const totalTransactions = logs.length;
  const totalRevenue = logs.reduce((sum, trx) => sum + Number(trx.amount || 0), 0);
  const totalProfit = logs.reduce((sum, trx) => sum + Number(trx.profit || 0), 0);

  let growth = 0;
  if (logs.length > 1) {
    const first = logs[0].amount;
    const last = logs[logs.length - 1].amount;
    if (first > 0) {
      growth = Math.round(((last - first) / first) * 100);
    }
  }

  const revenueData = logs.map(trx => trx.amount);

  res.send(`
  <html>
  <head>
    <title>Ramadan AI Analytics</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body{
        font-family:Segoe UI;
        background:linear-gradient(135deg,#0f172a,#064e3b);
        color:white;
        text-align:center;
        padding:40px;
      }
      .card{
        background:rgba(255,255,255,0.08);
        padding:25px;
        border-radius:15px;
        margin:20px auto;
        width:350px;
        box-shadow:0 10px 30px rgba(0,0,0,0.3);
      }
      .demo{
        color:#facc15;
        margin-bottom:20px;
        font-weight:bold;
      }
      canvas{
        margin-top:30px;
        max-width:700px;
      }
    </style>
  </head>

  <body>

    <h1>Ramadan AI Commerce Analytics</h1>

    ${demoMode ? "<div class='demo'>⚠ Demo Analytics Mode Active</div>" : ""}

    <div class="card">
      <h3>Total Transactions</h3>
      <h1>${totalTransactions.toLocaleString()}</h1>
    </div>

    <div class="card">
      <h3>Total Revenue</h3>
      <h1>Rp ${totalRevenue.toLocaleString()}</h1>
    </div>

    <div class="card">
      <h3>Total Profit</h3>
      <h1>Rp ${totalProfit.toLocaleString()}</h1>
    </div>

    <div class="card">
      <h3>Revenue Growth</h3>
      <h1>${growth}%</h1>
    </div>

    <canvas id="revenueChart"></canvas>

    <script>
      const ctx = document.getElementById('revenueChart');

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(revenueData.map((_, i) => "Transaction " + (i+1)))},
          datasets: [{
            label: 'Revenue Growth',
            data: ${JSON.stringify(revenueData)},
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.2)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          plugins: {
            legend: { labels: { color: 'white' } }
          },
          scales: {
            x: { ticks: { color: 'white' } },
            y: { ticks: { color: 'white' } }
          }
        }
      });
    </script>

  </body>
  </html>
  `);
});

// ======================
// JSON Stats Endpoint
// ======================
app.get("/api/stats", (req, res) => {

  const logPath = path.join(__dirname, "transactions.log");

  if (!fs.existsSync(logPath)) {
    return res.json({
      totalTransactions: 0,
      totalRevenue: 0,
      totalProfit: 0
    });
  }

  try {
    const logs = fs.readFileSync(logPath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map(l => {
        try { return JSON.parse(l); }
        catch { return null; }
      })
      .filter(Boolean);

    const totalTransactions = logs.length;
    const totalRevenue = logs.reduce((sum, trx) => sum + Number(trx.amount || 0), 0);
    const totalProfit = logs.reduce((sum, trx) => sum + Number(trx.profit || 0), 0);

    res.json({
      totalTransactions,
      totalRevenue,
      totalProfit
    });

  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Stats error" });
  }
});

// ======================
// Global Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ======================
// 404 Handler
// ======================
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Ramadan AI running on port ${PORT}`);
});
