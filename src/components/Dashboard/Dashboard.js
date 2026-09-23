"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Dashboard.module.css";

// Default dashboard payload used before the API response arrives.
const initialData = {
  chart: [],
  balances: { account: 0, cash: 0, assets: 0 },
  totalBalance: 0,
  today: { income: 0, expense: 0 },
  currentMonth: { income: 0, expense: 0 },
};

// Chart date range selector.
const ranges = [
  { value: "10d", label: "10 days" },
  { value: "month", label: "1 month" },
  { value: "year", label: "1 year" },
  { value: "all", label: "All time" },
];

// Quick actions for the dashboard hero section.
const quickActions = [
  { label: "Add money", href: "/add-money", tone: "primary", icon: "+" },
  { label: "Spent money", href: "/spent-money", tone: "danger", icon: "-" },
  { label: "Reports", href: "/reports", tone: "neutral", icon: "↗" },
];

function formatMoney(value) {
  return `৳${Math.round(Number(value || 0)).toLocaleString("en-BD")}`;
}

function Chart({ data, range }) {
  const width = 760;
  const height = 300;
  const padding = { top: 26, right: 18, bottom: 48, left: 68 };
  const max = Math.max(...data.flatMap((item) => [item.income, item.expense]), 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const x = (index) => padding.left + (index * chartWidth) / Math.max(data.length - 1, 1);
  const y = (value) => padding.top + chartHeight - (value / max) * chartHeight;
  const line = (key) => data.map((item, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(item[key])}`).join(" ");
  const scaleLabels = [max, max / 2, 0];
  const axisLabel = (item, index) => {
    if (range === "month") {
      const isInterval = index % 5 === 0 || index === data.length - 1;
      return isInterval ? new Date(`${item.key}T00:00:00Z`).getUTCDate() : "";
    }

    return item.label;
  };

  return (
    <div className={styles.chartWrap}>
      <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Income and expense chart">
        {scaleLabels.map((value) => (
          <g key={value}>
            <line x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} className={styles.gridLine} />
            <text x={padding.left - 9} y={y(value) + 4} textAnchor="end" className={styles.scaleLabel}>
              {formatMoney(value)}
            </text>
          </g>
        ))}

        <path d={line("income")} className={`${styles.chartLine} ${styles.incomeLine}`} />
        <path d={line("expense")} className={`${styles.chartLine} ${styles.expenseLine}`} />

        {data.map((item, index) => (
          <g key={item.key}>
            <circle cx={x(index)} cy={y(item.income)} r="4" className={styles.incomeDot} />
            <circle cx={x(index)} cy={y(item.expense)} r="4" className={styles.expenseDot} />
            <text x={x(index)} y={height - 13} textAnchor="middle" className={styles.axisLabel}>
              {axisLabel(item, index)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [range, setRange] = useState("10d");

  useEffect(() => {
    fetch(`/api/dashboard?range=${range}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Dashboard request failed");
        return response.json();
      })
      .then(setData)
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [range]);

  const netThisMonth = data.currentMonth.income - data.currentMonth.expense;
  const netToday = data.today.income - data.today.expense;
  const isNegative = data.totalBalance < 0;
  const savingsGoals = [
    {
      name: "Emergency fund",
      saved: Math.max(data.totalBalance > 0 ? data.totalBalance * 0.45 : 0, 0),
      target: Math.max(data.currentMonth.income * 2.5, 12000),
      color: "green",
    },
    {
      name: "Travel budget",
      saved: Math.max(data.currentMonth.income * 0.2, 0),
      target: Math.max(data.currentMonth.income * 0.6, 8000),
      color: "purple",
    },
    {
      name: "New laptop",
      saved: Math.max(data.currentMonth.income * 0.12, 0),
      target: Math.max(data.currentMonth.income * 0.35, 5000),
      color: "orange",
    },
  ];
  const recentTransactions = data.recentTransactions || [];
  const categorySpending = data.categorySpending || [];

  return (
    <>
      {/* Hero area with headline and total balance highlight. */}
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Your financial overview</p>
          <h1>Your money, made clearer.</h1>
          <p className={styles.description}>A calm view of your spending, saving, and the small wins adding up.</p>
        </div>

        <div className={`${styles.balanceCard} ${isNegative ? styles.negativeBalanceCard : ""}`}>
          <span>Total balance</span>
          <strong>{formatMoney(data.totalBalance)}</strong>
          <small>
            <b>{netThisMonth >= 0 ? "+" : "-"}{formatMoney(Math.abs(netThisMonth))}</b> this month
          </small>
        </div>
      </section>

      {/* Quick actions encourage action from the dashboard immediately. */}
      <section className={styles.quickActions} aria-label="Quick actions">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`${styles.quickAction} ${styles[action.tone]}`}
          >
            <span className={styles.quickActionIcon}>{action.icon}</span>
            <span>{action.label}</span>
          </Link>
        ))}
      </section>

      {isNegative && (
        <section className={styles.warningCard} role="status" aria-live="polite">
          <div className={styles.warningIcon} aria-hidden="true">
            !
          </div>
          <div className={styles.warningContent}>
            <h2>Spending is higher than income</h2>
            <p>
              You need <strong>{formatMoney(Math.abs(data.totalBalance))}</strong> to return your balance to zero.
            </p>
          </div>
          <div className={styles.warningActions}>
            <Link href="/reports">View expenses</Link>
            <Link href="/add-money">Add money</Link>
          </div>
        </section>
      )}

      {/* Summary stat cards make the top section feel more complete. */}
      <section className={styles.statsGrid} aria-label="Summary statistics">
        <article className={styles.statCard}>
          <span>Income</span>
          <strong>{formatMoney(data.currentMonth.income)}</strong>
          <small>Across this month</small>
        </article>

        <article className={styles.statCard}>
          <span>Spent</span>
          <strong>{formatMoney(data.currentMonth.expense)}</strong>
          <small>Current spending</small>
        </article>

        <article className={styles.statCard}>
          <span>Saved</span>
          <strong>{formatMoney(Math.max(netThisMonth, 0))}</strong>
          <small>Positive net flow</small>
        </article>
      </section>

      {/* Main cash-flow card with interactive range controls. */}
      <section className={styles.chartCard} aria-labelledby="cash-flow-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.cardEyebrow}>Cash flow</p>
            <h2 id="cash-flow-title">Income &amp; expenses</h2>
          </div>

          <div className={styles.legend}>
            <span>
              <i className={styles.incomeLegend}></i>Income
            </span>
            <span>
              <i className={styles.expenseLegend}></i>Expenses
            </span>
          </div>
        </div>

        <div className={styles.rangeSelector} role="group" aria-label="Chart date range">
          {ranges.map((option) => (
            <button
              key={option.value}
              type="button"
              className={range === option.value ? styles.rangeActive : ""}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.emptyState}>Loading your cash flow...</div>
        ) : hasError ? (
          <div className={styles.emptyState}>Unable to load dashboard data.</div>
        ) : data.chart.every((item) => item.income === 0 && item.expense === 0) ? (
          <div className={styles.emptyState}>Add a transaction to see your cash flow.</div>
        ) : (
          <Chart data={data.chart} range={range} />
        )}
      </section>

      {/* Spending and goals section gives the dashboard more product value. */}
      <section className={styles.insightsGrid}>
        <article className={styles.moneyTypesCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Where your money is</p>
              <h2>Money types</h2>
            </div>
            <span className={styles.totalPill}>{formatMoney(data.totalBalance)}</span>
          </div>

          <div className={styles.moneyTypeList}>
            <div>
              <span>
                <i className={styles.accountDot}></i>In account
              </span>
              <strong>{formatMoney(data.balances.account)}</strong>
            </div>
            <div>
              <span>
                <i className={styles.cashDot}></i>Cash
              </span>
              <strong>{formatMoney(data.balances.cash)}</strong>
            </div>
            <div>
              <span>
                <i className={styles.assetsDot}></i>Other assets
              </span>
              <strong>{formatMoney(data.balances.assets)}</strong>
            </div>
          </div>
        </article>

        <article className={styles.goalCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Goals</p>
              <h2>Savings target</h2>
            </div>
          </div>

          <div className={styles.goalList}>
            {savingsGoals.map((goal) => {
              const progress = Math.min((goal.saved / goal.target) * 100, 100);

              return (
                <div key={goal.name} className={styles.goalItem}>
                  <div className={styles.goalMeta}>
                    <span>{goal.name}</span>
                    <strong>{Math.round(progress)}%</strong>
                  </div>
                  <div className={styles.progressTrack}>
                    <span className={`${styles.progressBar} ${styles[goal.color]}`} style={{ width: `${progress}%` }} />
                  </div>
                  <small>
                    {formatMoney(goal.saved)} / {formatMoney(goal.target)}
                  </small>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className={styles.activityGrid}>
        <article className={styles.periodCard}>
          <p className={styles.cardEyebrow}>Today</p>
          <div className={styles.periodRow}>
            <span className={styles.incomeLabel}>Income</span>
            <strong>{formatMoney(data.today.income)}</strong>
          </div>
          <div className={styles.periodRow}>
            <span className={styles.expenseLabel}>Spent</span>
            <strong>{formatMoney(data.today.expense)}</strong>
          </div>
          <small className={netToday >= 0 ? styles.netPositive : styles.netNegative}>
            {netToday >= 0 ? "+" : "-"}{formatMoney(Math.abs(netToday))} net
          </small>
        </article>

        <article className={styles.periodCard}>
          <p className={styles.cardEyebrow}>This month</p>
          <div className={styles.periodRow}>
            <span className={styles.incomeLabel}>Income</span>
            <strong>{formatMoney(data.currentMonth.income)}</strong>
          </div>
          <div className={styles.periodRow}>
            <span className={styles.expenseLabel}>Spent</span>
            <strong>{formatMoney(data.currentMonth.expense)}</strong>
          </div>
          <small className={netThisMonth >= 0 ? styles.netPositive : styles.netNegative}>
            {netThisMonth >= 0 ? "+" : "-"}{formatMoney(Math.abs(netThisMonth))} net
          </small>
        </article>
      </section>

      {/* A personalized feed makes the app feel more like a modern product. */}
      <section className={styles.bottomGrid}>
        <article className={styles.listCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Activity</p>
              <h2>Recent transactions</h2>
            </div>
          </div>

          <div className={styles.transactionList}>
            {recentTransactions.map((item) => (
              <div key={`${item.title}-${item.date}`} className={styles.transactionItem}>
                <div className={styles.transactionInfo}>
                  <span className={`${styles.transactionType} ${item.type === "income" ? styles.incomeTag : styles.expenseTag}`}>
                    {item.type === "income" ? "Income" : "Expense"}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.category} · {item.date}</small>
                  </div>
                </div>
                <span className={item.type === "income" ? styles.moneyPositive : styles.moneyNegative}>
                  {item.type === "income" ? "+" : "-"}
                  {formatMoney(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.listCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Breakdown</p>
              <h2>Categories</h2>
            </div>
          </div>

          <div className={styles.categoryList}>
            {categorySpending.map((item) => (
              <div key={item.name} className={styles.categoryItem}>
                <div className={styles.categoryMeta}>
                  <span>{item.name}</span>
                  <strong>{formatMoney(item.spent)}</strong>
                </div>
                <div className={styles.progressTrack}>
                  <span className={`${styles.progressBar} ${styles[item.color]}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
