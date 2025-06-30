// src/components/Charts.js
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";

const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28", "#8884D8"];

const Charts = ({ transactions }) => {
  const incomeData = transactions.filter(t => t.type === "income");
  const expenseData = transactions.filter(t => t.type === "expense");

  const categorySummary = expenseData.reduce((acc, cur) => {
    acc[cur.category] = acc[cur.category] + cur.amount || cur.amount;
    return acc;
  }, {});
  const categoryData = Object.entries(categorySummary).map(([key, value]) => ({
    name: key,
    value,
  }));

  const dailyExpense = expenseData.reduce((acc, cur) => {
    const date = cur.date.substring(0, 10);
    acc[date] = acc[date] + cur.amount || cur.amount;
    return acc;
  }, {});
  const dailyExpenseData = Object.entries(dailyExpense).map(([date, amount]) => ({
    date,
    amount,
  }));

  return (
    <div className="charts">
      <h3>Category-wise Expense (Pie)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={categoryData}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            fill="#8884d8"
            label
          >
            {categoryData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <h3>Daily Expense Trend (Line)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={dailyExpenseData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line dataKey="amount" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>

      <h3>Income vs Expense (Bar)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={[
          { name: "Income", amount: incomeData.reduce((a, t) => a + t.amount, 0) },
          { name: "Expense", amount: expenseData.reduce((a, t) => a + t.amount, 0) }
        ]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#FF8042" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;
