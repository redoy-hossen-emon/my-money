"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";

function formatMoney(value) {
  return `৳${Math.round(Number(value || 0)).toLocaleString("en-BD")}`;
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className={styles.userIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19.25C6.27 15.96 8.39 14.25 12 14.25C15.61 14.25 17.73 15.96 18.5 19.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const profileRef = useRef(null);
  const [totalBalance, setTotalBalance] = useState(null);
  const [userName, setUserName] = useState("Account");
  const [userEmail, setUserEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/dashboard", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            setIsLoggedIn(false);
            setTotalBalance(null);
            return null;
          }

          throw new Error("Unable to load balance");
        }

        return response.json();
      })
      .then((data) => {
        if (!data || !isMounted) return;

        setIsLoggedIn(true);
        setTotalBalance(data.totalBalance);
        setUserName(data.user?.name || "Account");
        setUserEmail(data.user?.email || "");
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoggedIn(false);
        setTotalBalance(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function closeMenu(event) {
      if (!profileRef.current?.contains(event.target)) setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Pennywise home">
        <span className={styles.brandMark}>M</span>
        <span>My Money</span>
      </Link>

      {isLoggedIn && (
        <div className={styles.headerBalance} aria-live="polite">
          <span>Total balance</span>
          <strong className={totalBalance !== null && totalBalance < 0 ? styles.negativeBalance : ""}>{totalBalance === null ? "--" : formatMoney(totalBalance)}</strong>
        </div>
      )}

      {isLoggedIn ? (
        <div className={styles.profile} ref={profileRef}>
          <button className={styles.profileButton} type="button" aria-label="Open profile menu" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
            <span className={styles.avatar}><UserIcon /></span>
            <span className={styles.profileName}>{userName}</span>
            <span className={styles.chevron} aria-hidden="true">⌄</span>
          </button>
          <div className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ""}`} role="menu">
            <div className={styles.menuHeading}>Your account</div>
            <div className={styles.menuIdentity}>
              <strong>{userName}</strong>
              <span>{userEmail}</span>
            </div>
            <Link href="/profile" role="menuitem" onClick={() => setIsMenuOpen(false)}>Profile settings</Link>
            <Link href="/preferences" role="menuitem" onClick={() => setIsMenuOpen(false)}>Preferences</Link>
            <button className={styles.menuSignOut} type="button" role="menuitem" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      ) : (
        <Link className={styles.signInButton} href="/login">
          Sign in
        </Link>
      )}
    </header>
  );
}