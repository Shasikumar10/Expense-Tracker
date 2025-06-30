// backend/cron/recurringJob.js
const cron = require("node-cron");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

const createRecurringTransactions = async () => {
  const today = new Date();
  const firstDayOfMonth = today.getDate() === 1;

  if (!firstDayOfMonth) return;

  try {
    const recurringTransactions = await Transaction.find({ recurring: true });

    for (const txn of recurringTransactions) {
      const newTxn = new Transaction({
        user: txn.user,
        type: txn.type,
        amount: txn.amount,
        category: txn.category,
        note: txn.note + " (recurring)",
        date: new Date(), // today's date
        recurring: true,
      });

      await newTxn.save();
    }

    console.log("✅ Recurring transactions created successfully.");
  } catch (err) {
    console.error("❌ Error creating recurring transactions:", err);
  }
};

// Schedule job: Every day at midnight (00:00)
cron.schedule("0 0 * * *", () => {
  console.log("⏰ Running recurring transaction job...");
  createRecurringTransactions();
});
