import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Tesseract from "tesseract.js";
import Charts from "../components/Charts";
import PdfReport from "../components/PdfReport"; // Optional
import ChartSection from "../components/ChartSection";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logoutUser } = useContext(AuthContext);

  const userEmail = localStorage.getItem("userEmail") || "Unknown User";
  const token = localStorage.getItem("token");

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().substr(0, 10),
    isRecurring: false,
  });
  const [budget, setBudget] = useState(10000);
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    return localStorage.getItem("budget")
      ? parseInt(localStorage.getItem("budget"))
      : 0;
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [rates, setRates] = useState({});

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      window.history.go(1);
    };
  }, []);

  useEffect(() => {
    fetch("https://api.exchangerate.host/latest?base=INR")
      .then((res) => res.json())
      .then((data) => setRates(data.rates));
  }, []);

  const getConverted = (amount) => {
    if (!rates[currency]) return amount;
    return (amount * rates[currency]).toFixed(2);
  };

  const fetchTransactions = async () => {
    try {
      const res = await API.get("/transactions", config);
      setTransactions(res.data);
    } catch (err) {
      alert("Session expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      logoutUser();
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await API.put(`/transactions/${editId}`, form, config);
        setEditMode(false);
        setEditId(null);
      } else {
        await API.post("/transactions", form, config);
      }
      setForm({
        type: "expense",
        amount: "",
        category: "",
        note: "",
        date: new Date().toISOString().substr(0, 10),
        isRecurring: false,
      });
      fetchTransactions();
    } catch (err) {
      alert("❌ Failed to save transaction.");
    }
  };

  const handleEdit = (txn) => {
    setForm({
      type: txn.type,
      amount: txn.amount,
      category: txn.category,
      note: txn.note,
      date: txn.date.substring(0, 10),
      isRecurring: txn.isRecurring || false,
    });
    setEditId(txn._id);
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      await API.delete(`/transactions/${id}`, config);
      fetchTransactions();
    }
  };

  const handleOCR = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => console.log(m),
      });
      const text = result.data.text;
      const amountMatch = text.match(/(?:Rs\.?|₹|\$)?\s?(\d{2,6}(\.\d{1,2})?)/i);
      const dateMatch = text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/);
      const extractedAmount = amountMatch ? parseFloat(amountMatch[1]) : "";
      const extractedDate = dateMatch ? dateMatch[0].replaceAll("-", "/") : "";
      setForm((prev) => ({
        ...prev,
        amount: extractedAmount || prev.amount,
        date: extractedDate || prev.date,
      }));
      alert("✅ Text extracted from image.");
    } catch (err) {
      alert("❌ Failed to read image.");
    }
    setUploading(false);
  };

  const handleVoiceInput = () => {
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);

      const amountMatch = transcript.match(/(\d{2,6}(\.\d{1,2})?)/);
      const categoryMatch = transcript.match(
        /(food|travel|bills|rent|shopping|health|grocery|fuel|misc)/i
      );

      const extractedAmount = amountMatch ? parseFloat(amountMatch[1]) : "";
      const extractedCategory = categoryMatch
        ? categoryMatch[0].toLowerCase()
        : "";

      const today = new Date();
      setForm((prev) => ({
        ...prev,
        amount: extractedAmount || prev.amount,
        category: extractedCategory || prev.category,
        date: prev.date || today.toISOString().substr(0, 10),
      }));
      alert("✅ Voice input processed.");
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      alert("❌ Voice input failed.");
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Expense Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Date", "Type", "Amount", "Category", "Note"];
    const tableRows = [];

    transactions.forEach((txn) => {
      const txnData = [
        new Date(txn.date).toLocaleDateString(),
        txn.type,
        `₹${txn.amount}`,
        txn.category,
        txn.note || "-",
      ];
      tableRows.push(txnData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });

    doc.save("expense_report.pdf");
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonth = new Date().getMonth();
  const totalSpent = transactions
    .filter(
      (txn) =>
        new Date(txn.date).getMonth() === currentMonth &&
        txn.type === "expense"
    )
    .reduce((acc, txn) => acc + txn.amount, 0);

  const spendingPercent = ((totalExpense / budget) * 100).toFixed(1);
  const isOverBudget = totalExpense > budget;

  return (
    <div className="dashboard">
      <button
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          padding: "10px 15px",
          backgroundColor: "#ff4d4d",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
        onClick={() => {
          logoutUser();
          window.location.href = "/login";
        }}
      >
        Logout
      </button>

      <h2>Welcome to Expense Tracker</h2>
      <p style={{ fontSize: "14px", color: "gray" }}>
        Logged in as: {userEmail}
      </p>

      <div className="currency-selector">
        <label>Select Currency:</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {["INR", "USD", "EUR", "GBP", "JPY", "CAD"].map((cur) => (
            <option key={cur} value={cur}>
              {cur}
            </option>
          ))}
        </select>
      </div>

      <div style={{ margin: "20px 0" }}>
        <label>
          💰 Monthly Budget: ₹
          <input
            type="number"
            value={monthlyBudget}
            onChange={(e) => {
              setMonthlyBudget(parseInt(e.target.value));
              localStorage.setItem("budget", e.target.value);
            }}
            style={{
              padding: "5px",
              marginLeft: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>
      </div>

      {monthlyBudget > 0 && (
        <div
          style={{
            padding: "10px",
            backgroundColor: totalSpent > monthlyBudget ? "#ffcccc" : "#e6ffe6",
            color: totalSpent > monthlyBudget ? "red" : "green",
            marginBottom: "10px",
            borderRadius: "4px",
          }}
        >
          {totalSpent > monthlyBudget
            ? `🚨 You have exceeded your budget! (Spent ₹${totalSpent})`
            : `✅ You are within budget. (Spent ₹${totalSpent})`}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "5px" }}>📊 Budget Progress</div>
        <div
          style={{
            background: "#ddd",
            borderRadius: "4px",
            height: "20px",
            width: "100%",
          }}
        >
          <div
            style={{
              background: totalSpent > monthlyBudget ? "#f44336" : "#4caf50",
              height: "100%",
              width: `${
                monthlyBudget
                  ? Math.min((totalSpent / monthlyBudget) * 100, 100)
                  : 0
              }%`,
              borderRadius: "4px",
              textAlign: "right",
              color: "#fff",
              paddingRight: "5px",
              fontSize: "12px",
            }}
          >
            ₹{totalSpent}
          </div>
        </div>
      </div>

      <div className="summary">
        <h3>
          Total Income: {currency} ₹{getConverted(totalIncome)}
        </h3>
        <h3>
          Total Expense: {currency} ₹{getConverted(totalExpense)}
        </h3>
        <h3>
          Balance: {currency} ₹
          {getConverted(totalIncome - totalExpense)}
        </h3>
      </div>

      <div className="budget-section">
        <h3>Monthly Budget (Progress Bar Below): ₹{budget}</h3>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          placeholder="Set Budget"
        />
        <div className="progress-bar">
          <div
            className={`progress-fill ${isOverBudget ? "over" : ""}`}
            style={{ width: `${Math.min(spendingPercent, 100)}%` }}
          >
            {spendingPercent}%
          </div>
        </div>
        {isOverBudget && <p className="alert">⚠️ Budget exceeded!</p>}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleOCR(e.target.files[0])}
        />
        {uploading && <p>⏳ Scanning image...</p>}
      </div>

      <form className="transaction-form" onSubmit={handleSubmit}>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <input
          type="number"
          placeholder="Amount"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
        />

        <input
          type="text"
          placeholder="Category"
          required
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <input
          type="text"
          placeholder="Note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <label>
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) =>
              setForm({ ...form, isRecurring: e.target.checked })
            }
          />
          Recurring Monthly
        </label>

        <button type="submit">{editMode ? "Update" : "Add"}</button>
        <button type="button" onClick={handleVoiceInput}>
          🎤 Speak Transaction
        </button>

        {editMode && (
          <button
            type="button"
            onClick={() => {
              setEditMode(false);
              setEditId(null);
              setForm({
                type: "expense",
                amount: "",
                category: "",
                note: "",
                date: new Date().toISOString().substr(0, 10),
                isRecurring: false,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {isListening && <p>🎙️ Listening... Say: "500 grocery on June 5"</p>}

      <h3>Your Transactions</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Note</th>
            <th>Recurring</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t._id}>
              <td>{t.date.substring(0, 10)}</td>
              <td>{t.type}</td>
              <td>
                {currency} ₹{getConverted(t.amount)}
              </td>
              <td>{t.category}</td>
              <td>{t.note}</td>
              <td>{t.isRecurring ? "✅" : "—"}</td>
              <td>
                <button onClick={() => handleEdit(t)}>Edit</button>
                <button onClick={() => handleDelete(t._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {transactions.length > 0 && (
        <>
          <ChartSection transactions={transactions} />
          <Charts transactions={transactions} />
          <button onClick={exportToPDF}>📄 Download PDF Report</button>
        </>
      )}
    </div>
  );
};

export default Dashboard;
