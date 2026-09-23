import clientPromise from "../../../src/lib/mongodb";
import { getRequestSession } from "../../../src/lib/auth";

function amountToNumber(value) {
  return value ? Number(value.toString()) : 0;
}

function getMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function getBangladeshDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function createPoint(date, unit) {
  const key = unit === "day" ? getDayKey(date) : getMonthKey(date);
  return {
    key,
    label: unit === "day"
      ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
      : date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
    income: 0,
    expense: 0,
  };
}

function summarizeRecentTransactions(transactions) {
  return [...transactions]
    .sort((first, second) => String(second.date).localeCompare(String(first.date)))
    .slice(0, 4)
    .map((transaction) => ({
      title: transaction.type === "income" ? (transaction.source || "Income") : (transaction.spentFor || "Expense"),
      type: transaction.type === "expense" ? "expense" : "income",
      amount: amountToNumber(transaction.amount),
      date: String(transaction.date),
      category: transaction.type === "expense" ? (transaction.spentFor || "General") : (transaction.source || "Income"),
    }));
}

function summarizeCategorySpending(transactions) {
  const spending = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((map, transaction) => {
      const name = transaction.spentFor || "General";
      map[name] = (map[name] || 0) + amountToNumber(transaction.amount);
      return map;
    }, {});

  const entries = Object.entries(spending)
    .map(([name, spent]) => ({ name, spent }))
    .sort((first, second) => second.spent - first.spent);

  const highest = entries[0]?.spent || 1;

  return entries.map((item) => ({
    name: item.name,
    spent: item.spent,
    percent: Math.max((item.spent / highest) * 100, 12),
    color: ["food", "transport", "bills", "shopping"][Math.abs(item.name.length) % 4],
  }));
}

function getChartWindow(range, transactions) {
  const now = new Date();
  let unit = "day";
  let start;
  let count;

  if (range === "month") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
    count = 30;
  } else if (range === "year") {
    unit = "month";
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    count = 12;
  } else if (range === "all") {
    unit = "month";
    const dates = transactions.map((transaction) => String(transaction.date).slice(0, 7)).filter(Boolean).sort();
    start = dates.length ? new Date(`${dates[0]}-01T00:00:00Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthDifference = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth();
    count = Math.max(monthDifference + 1, 1);
  } else {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 9));
    count = 10;
  }

  const points = [];
  for (let index = 0; index < count; index += 1) {
    const date = new Date(start);
    if (unit === "day") date.setUTCDate(start.getUTCDate() + index);
    else date.setUTCMonth(start.getUTCMonth() + index);
    points.push(createPoint(date, unit));
  }

  return points;
}

export async function GET(request) {
  try {
    const session = getRequestSession(request);
    if (!session?.userId) return Response.json({ error: "Please log in." }, { status: 401 });
    const range = new URL(request.url).searchParams.get("range") || "10d";
    const selectedRange = ["10d", "month", "year", "all"].includes(range) ? range : "10d";
    const client = await clientPromise;
    const [income, expenses] = await Promise.all([
      client.db("my-money").collection("income").find({ userId: session.userId }).toArray(),
      client.db("my-money").collection("expenses").find({ userId: session.userId }).toArray(),
    ]);
    const user = await client.db("my-money").collection("users").findOne({ userId: session.userId }, { projection: { name: 1, email: 1 } });
    const transactions = [...income, ...expenses];
    const chart = getChartWindow(selectedRange, transactions);
    const chartMap = new Map(chart.map((point) => [point.key, point]));
    const balances = { account: 0, cash: 0, assets: 0 };
    const currentMonthKey = getMonthKey(new Date());
    const currentMonth = { income: 0, expense: 0 };
    const today = { income: 0, expense: 0 };
    const todayKey = getBangladeshDate();

    for (const transaction of transactions) {
      const amount = amountToNumber(transaction.amount);
      const multiplier = transaction.type === "expense" ? -1 : 1;
      const balanceKey = transaction.account === "cash" ? "cash" : transaction.account === "savings" ? "assets" : "account";
      balances[balanceKey] += amount * multiplier;

      const dateKey = String(transaction.date);
      const chartKey = selectedRange === "10d" || selectedRange === "month" ? dateKey.slice(0, 10) : dateKey.slice(0, 7);
      const point = chartMap.get(chartKey);
      const transactionType = transaction.type === "expense" ? "expense" : "income";
      if (point) {
        point[transactionType] += amount;
      }
      if (dateKey.slice(0, 7) === currentMonthKey) {
        currentMonth[transactionType] += amount;
      }
      if (dateKey.slice(0, 10) === todayKey) {
        today[transactionType] += amount;
      }
    }

    const totalBalance = Object.values(balances).reduce((sum, value) => sum + value, 0);
    const recentTransactions = summarizeRecentTransactions(transactions);
    const categorySpending = summarizeCategorySpending(transactions);

    return Response.json({
      chart,
      user: user ? { name: user.name, email: user.email } : null,
      range: selectedRange,
      balances,
      totalBalance,
      today,
      currentMonth: { income: currentMonth.income, expense: currentMonth.expense },
      recentTransactions,
      categorySpending,
    });
  } catch (error) {
    console.error("Dashboard data query failed:", error);
    return Response.json({ error: "Unable to load dashboard data." }, { status: 500 });
  }
}