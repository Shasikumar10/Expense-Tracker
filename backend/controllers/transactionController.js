// controllers/transactionController.js
const Transaction = require("../models/Transaction");

exports.addTransaction = async (req, res) => {
  try {
    const { type, amount, category, note, date } = req.body;
    const transaction = new Transaction({
      user: req.user,
      type,
      amount,
      category,
      note,
      date,
    });
    await transaction.save();
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user }).sort({
      date: -1,
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user,
    });
    if (!transaction)
      return res.status(404).json({ msg: "Transaction not found" });
    res.json({ msg: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { type, amount, category, note, date } = req.body;
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      { type, amount, category, note, date },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ msg: "Transaction not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
