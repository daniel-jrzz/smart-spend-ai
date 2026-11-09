const express = require("express");

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "smartspend-api"
  });
});


const transactions = [
  { id: 1, category: "Software", amount: 49.99 },
  { id: 2, category: "Travel", amount: 125.50 },
  { id: 3, category: "Office Supplies", amount: 75.00 },
  { id: 4, category: "Software", amount: 30.00 }
];

app.get("/api/transactions", (req, res) => {
  res.json(transactions);
});


app.get("/api/analytics/summary", (req, res) => {
  const totalSpending = transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  res.json({
    totalSpending: totalSpending,
    transactionCount: transactions.length
  });
});

app.get("/api/analytics/categories", (req,res) => {
  const categoryTotals = {};

  transactions.forEach((transaction) => {
    const category = transaction.category;

    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }

    categoryTotals[category] = Math.round(
  (categoryTotals[category] + transaction.amount) * 100
) / 100;
  });

  res.json(categoryTotals);
});

// Start the server
app.listen(PORT, () => {
  console.log(`SmartSpend API running on http://localhost:${PORT}`);
});