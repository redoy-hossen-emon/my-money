"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./SpentMoneyForm.module.css";

export default function SpentMoneyForm({ currentDate }) {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);
    setStatus({ type: "", message: "" });

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save expense.");
      }

      form.reset();
      setStatus({ type: "success", message: "Expense saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.amountField}>
        <label htmlFor="expense-amount">Amount</label>
        <div className={styles.amountInput}>
          <span aria-hidden="true">৳</span>
          <input id="expense-amount" name="amount" type="number" min="0" step="any" inputMode="decimal" placeholder="0.00" required />
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="spent-for">Spent for</label>
          <input id="spent-for" name="spentFor" type="text" placeholder="e.g. Groceries" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="expense-account">Money Type</label>
          <select id="expense-account" name="account" defaultValue="checking" required>
            <option value="checking">In Account</option>
            <option value="cash">Cash</option>
            <option value="savings">Other Assets</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="expense-date">Date</label>
          <input id="expense-date" name="date" type="date" defaultValue={currentDate} required />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="expense-note">Note <span>Optional</span></label>
        <textarea id="expense-note" name="note" rows="3" placeholder="Add a little context..."></textarea>
      </div>

      {status.message && <p className={`${styles.status} ${styles[status.type]}`} role="status">{status.message}</p>}
      <div className={styles.actions}>
        <Link className={styles.cancel} href="/">Cancel</Link>
        <button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save expense"} <span aria-hidden="true">↗</span></button>
      </div>
    </form>
  );
}