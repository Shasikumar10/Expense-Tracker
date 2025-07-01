import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a832a6"];

const ChartSection = ({ transactions }) => {
  // Category-wise total (for Pie Chart)
  const categoryMap = {};
  transactions.forEach((txn) => {
    if (!categoryMap[txn.category]) {
      categoryMap[txn.category] = 0;
    }
    categoryMap[txn.category] += txn.amount;
  });
  const pieData = Object.entries(categoryMap).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // Date-wise total (for Bar Chart)
  const dateMap = {};
  transactions.forEach((txn) => {
    const date = new Date(txn.date).toLocaleDateString();
    if (!dateMap[date]) {
      dateMap[date] = 0;
    }
    dateMap[date] += txn.amount;
  });
  const barData = Object.entries(dateMap).map(([date, total]) => ({
    date,
    total,
  }));

  return (
    <div className="charts">
      <h3>Spending by Category</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name }) => name}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: 40 }}>Spending Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartSection;
