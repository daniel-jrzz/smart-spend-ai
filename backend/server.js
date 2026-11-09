const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync"); // curly braces {} mean we're extracting the named parse export from thep package

const app = express();
const PORT = 3000;


const upload = multer({ // creates upload-handling middleware
  storage: multer.memoryStorage(), // keeps uploaded file contents in RAM rather than saving in disk
  limits: {
    fileSize: 1024 * 1024 //limits uploads to 1 MB
  }
});


// Middleware to parse JSON requests
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "smartspend-api"
  });
});


let transactions = [
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


app.post("/api/transactions/upload", upload.single("file"), (req, res) => { //endpoint validates basic columns and amounts
  //app.post handles HTTP POST requrest which clients use to submit data
  //upload.single("file") is the middleware that tells Multer to expect one uploaded file named "file". its contens become available through req.file
  if (!req.file) {
    return res.status(400).json({
      error: "No CSV file uploaded"
    });
  }

  try {
    const csvText = req.file.buffer.toString("utf-8");

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const requiredColumns = ["date", "category", "amount", "description"];

    if (records.length === 0 ||
        !requiredColumns.every(col =>
          Object.hasOwn(records[0], col)
        )) {
      return res.status(400).json({
        error: "CSV must contain date, category, amount, description"
      });
    }

    const parsedTransactions = records.map((record, index) => { //.map() transforms every element in an array into a new element.
      //here .map converts every element into an array
      const amount = Number(record.amount); // Number() counts a numeric string like "49.99" into a JS number 49.99

      if (
        !Number.isFinite(amount) ||
        amount < 0 ||
        !record.date ||
        !record.category ||
        !record.description
      ) {
        throw new Error(`Invalid transaction at row ${index + 2}`);
      }

      return {
        id: index + 1,
        date: record.date,
        category: record.category,
        amount: amount,
        description: record.description
      };
    });

    transactions = parsedTransactions;

    res.json({
      message: "CSV uploaded successfully",
      transactionCount: transactions.length
    });

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`SmartSpend API running on http://localhost:${PORT}`);
});