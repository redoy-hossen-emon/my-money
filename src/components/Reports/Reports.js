"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Reports.module.css";

function formatMoney(value) {
  return `৳${Math.round(Number(value || 0)).toLocaleString("en-BD")}`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

function moneyType(value) {
  return value === "cash" ? "Cash" : value === "savings" ? "Other assets" : "In account";
}

function EditTransaction({ item, type, onCancel, onSaved }) {
  const [form, setForm] = useState({ amount: String(item.amount), date: item.date, account: item.account, note: item.note, source: item.source, spentFor: item.spentFor });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, type, ...form }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update transaction.");
      onSaved({ ...item, ...form, amount: Number(form.amount), type });
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <form className={styles.editForm} onSubmit={save}>
      <div className={styles.editGrid}>
        <input name={type === "income" ? "source" : "spentFor"} value={type === "income" ? form.source : form.spentFor} onChange={updateField} placeholder={type === "income" ? "Source" : "Spent for"} required />
        <input name="amount" value={form.amount} onChange={updateField} type="number" min="0" step="any" inputMode="decimal" required />
        <select name="account" value={form.account} onChange={updateField}><option value="checking">In account</option><option value="cash">Cash</option><option value="savings">Other assets</option></select>
        <input name="date" value={form.date} onChange={updateField} type="date" required />
        <input className={styles.editNote} name="note" value={form.note} onChange={updateField} placeholder="Note (optional)" />
      </div>
      {error && <p className={styles.editError} role="alert">{error}</p>}
      <div className={styles.editActions}><button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

function TransactionList({ items, type, editingId, setEditingId, onSaved }) {
  if (!items.length) return <div className={styles.empty}>No {type === "income" ? "income" : "expenses"} recorded yet.</div>;

  return <div className={styles.list}>
    {items.map((item) => editingId === item.id ? <EditTransaction key={item.id} item={item} type={type} onCancel={() => setEditingId("")} onSaved={onSaved} /> : <article className={styles.transaction} key={item.id}>
        <div className={`${styles.transactionIcon} ${type === "income" ? styles.incomeIcon : styles.expenseIcon}`} aria-hidden="true">{type === "income" ? "↑" : "↓"}</div>
        <div className={styles.transactionMain}>
          <strong>{type === "income" ? item.source : item.spentFor}</strong>
          <span>{formatDate(item.date)} · {moneyType(item.account)}</span>
          {item.note && <small>{item.note}</small>}
        </div>
        <strong className={`${styles.amount} ${type === "income" ? styles.incomeAmount : styles.expenseAmount}`}>{type === "income" ? "+" : "-"}{formatMoney(item.amount)}</strong>
        <button className={styles.editButton} type="button" onClick={() => setEditingId(item.id)} aria-label={`Edit ${type === "income" ? item.source : item.spentFor}`}>Edit</button>
      </article>)}
  </div>;
}

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("income");
  const [state, setState] = useState("loading");
  const [editingId, setEditingId] = useState("");
  const touchStart = useRef(0);
  const income = transactions.filter((item) => item.type === "income");
  const expenses = transactions.filter((item) => item.type === "expense");

  useEffect(() => {
    fetch("/api/reports", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load reports");
        return response.json();
      })
      .then((data) => { setTransactions(data.transactions); setState("ready"); })
      .catch(() => setState("error"));
  }, []);

  function handleTouchStart(event) { touchStart.current = event.changedTouches[0].clientX; }
  function handleTouchEnd(event) {
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) < 50) return;
    setActiveTab(distance < 0 ? "expense" : "income");
  }

  function updateTransaction(updated) {
    setTransactions((current) => current.map((item) => item.id === updated.id ? updated : item));
    setEditingId("");
  }

  return (
    <section className={styles.reportCard} aria-label="Income and expense reports">
      <div className={styles.summary}><span>{transactions.length} transactions</span><span><b className={styles.incomeText}>↑ {income.length} income</b><b className={styles.expenseText}>↓ {expenses.length} spent</b></span></div>
      <div className={styles.tabs} role="tablist" aria-label="Report type">
        <button className={activeTab === "income" ? styles.tabActive : ""} type="button" role="tab" aria-selected={activeTab === "income"} onClick={() => setActiveTab("income")}>Income <span>{income.length}</span></button>
        <button className={activeTab === "expense" ? styles.tabActive : ""} type="button" role="tab" aria-selected={activeTab === "expense"} onClick={() => setActiveTab("expense")}>Spent <span>{expenses.length}</span></button>
      </div>
      <div className={styles.swipeHint}>Swipe left or right to switch reports</div>
      <div className={styles.panels} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {state === "loading" && <div className={styles.empty}>Loading reports...</div>}
        {state === "error" && <div className={styles.empty}>Unable to load reports.</div>}
        {state === "ready" && <TransactionList items={activeTab === "income" ? income : expenses} type={activeTab} editingId={editingId} setEditingId={setEditingId} onSaved={updateTransaction} />}
      </div>
    </section>
  );
}