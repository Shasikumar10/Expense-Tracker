// backend/routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/authMiddleware");

// GET all transactions for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
  res.json(transactions);
});

// POST a new transaction
router.post("/", authMiddleware, async (req, res) => {
  const txn = new Transaction({ ...req.body, user: req.user.id });
  const saved = await txn.save();
  res.json(saved);
});

// DELETE a transaction
router.delete("/:id", authMiddleware, async (req, res) => {
  await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.sendStatus(204);
});

// UPDATE a transaction
router.put("/:id", authMiddleware, async (req, res) => {
  const updated = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true }
  );
  res.json(updated);
});

module.exports = router;
