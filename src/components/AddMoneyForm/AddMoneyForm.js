"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./AddMoneyForm.module.css";

export default function AddMoneyForm({ currentDate }) {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save transaction.");
      }

      form.reset();
      setStatus({ type: "success", message: "Transaction saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.amountField}>
        <label htmlFor="amount">Amount</label>
        <div className={styles.amountInput}>
          <span aria-hidden="true">৳</span>
          <input id="amount" name="amount" type="number" min="0" step="any" inputMode="decimal" placeholder="0.00" required />
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="source">Source</label>
          <select id="source" name="source" defaultValue="" required>
            <option value="" disabled>Select a source</option>
            <option>Salary</option>
            <option>Freelance work</option>
            <option>Business</option>
            <option>Gift</option>
            <option>Other income</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="account">Money Type</label>
          <select id="account" name="account" defaultValue="checking" required>
            <option value="checking">In Account</option>
            <option value="cash">Cash</option>
            <option value="savings">Other Assets</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" defaultValue={currentDate} required />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="note">Note <span>Optional</span></label>
        <textarea id="note" name="note" rows="3" placeholder="Add a little context..."></textarea>
      </div>

      {status.message && <p className={`${styles.status} ${styles[status.type]}`} role="status">{status.message}</p>}
      <div className={styles.actions}>
        <Link className={styles.cancel} href="/">Cancel</Link>
        <button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save "} <span aria-hidden="true">↗</span></button>
      </div>
    </form>
  );
}