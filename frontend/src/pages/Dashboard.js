import Charts from "../components/Charts";
import PdfReport from "../components/PdfReport";
import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const userEmail = localStorage.getItem("userEmail") || "Unknown User";
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().substr(0, 10),
    isRecurring: false, // ✅ New field added
  });
  const [budget, setBudget] = useState(10000);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchTransactions = async () => {
    try {
      const res = await API.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
      alert("Session expired, please log in again.");
      localStorage.removeItem("token");
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
        await API.put(`/transactions/${editId}`, form);
        setEditMode(false);
        setEditId(null);
      } else {
        await API.post("/transactions", form);
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
      alert("Failed to save transaction");
    }
  };

  const handleEdit = (t) => {
    setForm({
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note,
      date: t.date.substring(0, 10),
      isRecurring: t.isRecurring || false, // handle undefined
    });
    setEditId(t._id);
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      await API.delete(`/transactions/${id}`);
      fetchTransactions();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const spendingPercent = ((totalExpense / budget) * 100).toFixed(1);
  const isOverBudget = totalExpense > budget;

  return (
    <div className="dashboard">
      <h2>Welcome to Expense Tracker</h2>
      <p style={{ fontSize: "14px", color: "gray" }}>Logged in as: {userEmail}</p>
      <button onClick={handleLogout}>Logout</button>

      <div className="summary">
        <h3>Total Income: ₹{totalIncome}</h3>
        <h3>Total Expense: ₹{totalExpense}</h3>
        <h3>Balance: ₹{totalIncome - totalExpense}</h3>
      </div>

      <div className="budget-section">
        <h3>Monthly Budget: ₹{budget}</h3>
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
        {isOverBudget && (
          <p className="alert">⚠️ You've exceeded your monthly budget!</p>
        )}
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

        {/* ✅ New Recurring Checkbox */}
        <label>
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) =>
              setForm({
                ...form,
                isRecurring: e.target.checked,
              })
            }
          />
          Recurring Monthly
        </label>

        <button type="submit">{editMode ? "Update" : "Add"}</button>

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
              <td>₹{t.amount}</td>
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

      {transactions.length > 0 && <Charts transactions={transactions} />}

      {transactions.length > 0 && (
        <PdfReport transactions={transactions} userEmail={userEmail} />
      )}
    </div>
  );
};

export default Dashboard;
