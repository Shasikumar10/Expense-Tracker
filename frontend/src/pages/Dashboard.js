// src/pages/Dashboard.js
import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Charts from "../components/Charts";

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().substr(0, 10),
  });

  const navigate = useNavigate();

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

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await API.post("/transactions", form);
      setForm({
        type: "expense",
        amount: "",
        category: "",
        note: "",
        date: new Date().toISOString().substr(0, 10),
      });
      fetchTransactions();
    } catch (err) {
      alert("Failed to add transaction");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      await API.delete(`/transactions/${id}`);
      fetchTransactions();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="dashboard">
      <h2>Welcome to Expense Tracker</h2>
      <button onClick={handleLogout}>Logout</button>

      <div className="summary">
        <h3>Total Income: ₹{totalIncome}</h3>
        <h3>Total Expense: ₹{totalExpense}</h3>
        <h3>Balance: ₹{totalIncome - totalExpense}</h3>
      </div>

      {/* ✅ This was the issue — now placed inside return */}
      {transactions.length > 0 && <Charts transactions={transactions} />}

      <form className="transaction-form" onSubmit={handleAdd}>
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

        <button type="submit">Add</button>
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
              <td>
                <button onClick={() => handleDelete(t._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
