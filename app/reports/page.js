import Link from "next/link";
import Header from "../../src/components/Header/Header";
import Footer from "../../src/components/Footer/Footer";
import Reports from "../../src/components/Reports/Reports";
import { getPageSession } from "../../src/lib/auth";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export const metadata = {
  title: "Reports | Pennywise",
  description: "Review all income and expenses in Pennywise.",
};

export default async function ReportsPage() {
  if (!(await getPageSession())) redirect("/login");
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Link className={styles.backLink} href="/">
          <span aria-hidden="true">←</span> Back to overview
        </Link>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>Transaction history</p>
          <h1>Reports</h1>
          <p>See every income and expense in one clear timeline.</p>
        </section>
        <Reports />
      </main>
      <Footer />
    </div>
  );
}