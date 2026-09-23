"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./ProfileSettings.module.css";

const emptyForm = { name: "", email: "", currentPassword: "", newPassword: "" };

export default function ProfileSettings() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/profile", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }
        if (!response.ok) throw new Error("Unable to load profile");
        return response.json();
      })
      .then((data) => {
        if (data?.user) setForm((current) => ({ ...current, ...data.user }));
      })
      .catch(() => setStatus({ type: "error", message: "Unable to load your profile." }))
      .finally(() => setIsLoading(false));
  }, [router]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update your profile.");
      setForm((current) => ({ ...current, ...data.user, currentPassword: "", newPassword: "" }));
      setStatus({ type: "success", message: "Your profile has been updated." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Link className={styles.backLink} href="/">
        <span aria-hidden="true">←</span> Back to overview
      </Link>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>Your account</p>
        <h1>Profile settings</h1>
        <p>Keep your account details current and your sign-in secure.</p>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div><p>Personal details</p><h2>How we know you</h2></div>
            <span className={styles.panelNumber}>01</span>
          </div>
          <div className={styles.fields}>
            <label>Name<input name="name" value={form.name} onChange={updateField} disabled={isLoading} required /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={updateField} disabled={isLoading} required /></label>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div><p>Security</p><h2>Change password</h2></div>
            <span className={styles.panelNumber}>02</span>
          </div>
          <p className={styles.helper}>Leave both fields empty to keep your current password.</p>
          <div className={styles.fields}>
            <label>Current password<input name="currentPassword" type="password" value={form.currentPassword} onChange={updateField} autoComplete="current-password" /></label>
            <label>New password<input name="newPassword" type="password" value={form.newPassword} onChange={updateField} autoComplete="new-password" minLength={6} /></label>
          </div>
        </section>

        <div className={styles.actions}>
          {status.message && <p className={status.type === "error" ? styles.error : styles.success} role="status">{status.message}</p>}
          <button type="submit" disabled={isLoading || isSaving}>{isSaving ? "Saving..." : "Save changes"}</button>
        </div>
      </form>
    </>
  );
}