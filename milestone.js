const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory storage
const expenses = [];
const predefinedCategories = ["Food", "Travel", "Entertainment", "Shopping", "Utilities"];

// Helper functions

// Validate expense data
const validateExpense = (expense) => {
    if (!expense.category || !predefinedCategories.includes(expense.category)) {
        return { valid: false, error: "Invalid category" };
    }
    if (!expense.amount || typeof expense.amount !== "number" || expense.amount <= 0) {
        return { valid: false, error: "Amount must be a positive number" };
    }
    if (!expense.date || isNaN(Date.parse(expense.date))) {
        return { valid: false, error: "Invalid date format" };
    }
    return { valid: true };
};

// Generate summary with filters
const getSummary = (filterBy = {}) => {
    const { category, startDate, endDate } = filterBy;
    let filteredExpenses = expenses;

    // Apply category filter
    if (category) {
        filteredExpenses = filteredExpenses.filter((e) => e.category === category);
    }

    // Apply date range filter
    if (startDate || endDate) {
        filteredExpenses = filteredExpenses.filter((e) => {
            const date = new Date(e.date);
            if (startDate && date < new Date(startDate)) return false;
            if (endDate && date > new Date(endDate)) return false;
            return true;
        });
    }

    // Calculate total amount
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { total, expenses: filteredExpenses };
};

// API Endpoints

// Add Expense
app.post("/expenses", (req, res) => {
    const { category, amount, date } = req.body;

    const validation = validateExpense({ category, amount, date });
    if (!validation.valid) {
        return res.status(400).json({ status: "error", data: null, error: validation.error });
    }

    const newExpense = { id: expenses.length + 1, category, amount, date };
    expenses.push(newExpense);

    res.status(201).json({ status: "success", data: newExpense, error: null });
});

// Get Expenses with Filters
app.get("/expenses", (req, res) => {
    const { category, startDate, endDate } = req.query;
    const summary = getSummary({ category, startDate, endDate });
    res.json({ status: "success", data: summary, error: null });
});


// Analyze Spending
app.get("/expenses/analysis", (req, res) => {
    // Group expenses by category
    const totalByCategory = predefinedCategories.map((category) => {
        const total = expenses
            .filter((e) => e.category === category)
            .reduce((sum, e) => sum + e.amount, 0);
        return { category, total };
    });

    // Group expenses by month
    const monthlyTotals = expenses.reduce((acc, e) => {
        const month = new Date(e.date).toISOString().slice(0, 7); // "YYYY-MM"
        acc[month] = (acc[month] || 0) + e.amount;
        return acc;
    }, {});

    res.json({
        status: "success",
        data: { totalByCategory, monthlyTotals },
        error: null,
    });
});

// CRON Jobs for Summary Reports

// Daily Summary
cron.schedule("0 0 * * *", () => {
    const today = new Date().toISOString().split("T")[0];
    const dailySummary = getSummary({ startDate: today, endDate: today });
    console.log("Daily Expense Summary:", dailySummary);
});

// Weekly Summary
cron.schedule("0 0 * * 0", () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const weeklySummary = getSummary({
        startDate: startDate.toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
    });
    console.log("Weekly Expense Summary:", weeklySummary);
});

// Monthly Summary
cron.schedule("0 0 1 * *", () => {
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setMonth(startDate.getMonth() - 1);

    const endDate = new Date();
    endDate.setDate(0); // Last day of the previous month

    const monthlySummary = getSummary({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
    });
    console.log("Monthly Expense Summary:", monthlySummary);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


// In-memory storage using Map
const expenseMap = new Map();

// Add Expense (updates the Map)
app.post("/expenses", (req, res) => {
    const { category, amount, date } = req.body;

    const validation = validateExpense({ category, amount, date });
    if (!validation.valid) {
        return res.status(400).json({ status: "error", data: null, error: validation.error });
    }

    const id = expenseMap.size + 1;
    const newExpense = { id, category, amount, date };
    expenseMap.set(id, newExpense);

    res.status(201).json({ status: "success", data: newExpense, error: null });
});

// Get Expenses (reads from the Map)
app.get("/expenses", (req, res) => {
    const { category, startDate, endDate } = req.query;
    const summary = getSummary({ category, startDate, endDate });
    res.json({ status: "success", data: summary, error: null });
});



