"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../../src/components/Header/Header";
import Footer from "../../src/components/Footer/Footer";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const defaults = { currency: "BDT", landingPage: "overview", reduceMotion: false };

export default function PreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === "undefined") return defaults;
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem("my-money-preferences") || "{}") };
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);

  function updatePreference(event) {
    const { name, value, checked, type } = event.target;
    const next = { ...preferences, [name]: type === "checkbox" ? checked : value };
    setPreferences(next);
    localStorage.setItem("my-money-preferences", JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Link className={styles.backLink} href="/"><span aria-hidden="true">←</span> Back to overview</Link>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>Workspace</p>
          <h1>Preferences</h1>
          <p>Shape the way My Money feels when you return to it.</p>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHeading}><div><p>Display</p><h2>Your defaults</h2></div><span>01</span></div>
          <label className={styles.selectField}>Currency
            <select name="currency" value={preferences.currency} onChange={updatePreference}>
              <option value="BDT">Bangladeshi taka (৳)</option><option value="USD">US dollar ($)</option><option value="EUR">Euro (€)</option>
            </select>
          </label>
          <label className={styles.selectField}>Opening page
            <select name="landingPage" value={preferences.landingPage} onChange={updatePreference}>
              <option value="overview">Overview</option><option value="reports">Reports</option>
            </select>
          </label>
          <label className={styles.toggle}><input name="reduceMotion" type="checkbox" checked={preferences.reduceMotion} onChange={updatePreference} /><span><strong>Reduce motion</strong><small>Use quieter transitions throughout the app.</small></span><i aria-hidden="true" /></label>
        </section>
        <div className={styles.actions}>
          <p className={saved ? styles.saved : ""} role="status">{saved ? "Preferences saved" : "Saved on this device"}</p>
          <button type="button" onClick={() => router.push(preferences.landingPage === "reports" ? "/reports" : "/")}>Return to {preferences.landingPage === "reports" ? "reports" : "overview"}</button>
        </div>
      </main>
      <Footer />
    </div>
  );
}