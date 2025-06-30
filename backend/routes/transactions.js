// routes/transactions.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
} = require("../controllers/transactionController");

const router = express.Router();

router.post("/", auth, addTransaction);
router.get("/", auth, getTransactions);
router.delete("/:id", auth, deleteTransaction);
router.put("/:id", auth, updateTransaction);

module.exports = router;
