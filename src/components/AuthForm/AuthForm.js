"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./AuthForm.module.css";

export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        const detail = result.details ? ` ${result.details}` : "";
        throw new Error(`${result.error || "Unable to continue."}${detail}`);
      }
      window.location.replace("/");
    } catch (submissionError) {
      setError(submissionError.message);
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.mark}>P</div>
      <p className={styles.eyebrow}>Pennywise</p>
      <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className={styles.description}>{isRegister ? "Start making your money easier to understand." : "Sign in to see your personal money overview."}</p>
      <form onSubmit={submit}>
        {isRegister && <div className={styles.field}><label htmlFor="name">Name</label><input id="name" name="name" autoComplete="name" required /></div>}
        <div className={styles.field}><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className={styles.field}><label htmlFor="password">Password</label><div className={styles.passwordField}><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} minLength="6" required /><button className={styles.eyeButton} type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "◉" : "◌"}</button></div></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.submit} disabled={isLoading} type="submit">{isLoading ? "Please wait..." : isRegister ? "Create account" : "Log in"}</button>
      </form>
      <p className={styles.switch}>{isRegister ? "Already have an account?" : "New to Pennywise?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Register"}</Link></p>
    </div>
  );
}
