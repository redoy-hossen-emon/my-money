import Link from "next/link";
import Header from "../../src/components/Header/Header";
import Footer from "../../src/components/Footer/Footer";
import AddMoneyForm from "../../src/components/AddMoneyForm/AddMoneyForm";
import { getPageSession } from "../../src/lib/auth";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export const metadata = {
  title: "Add money | my-money",
  description: "Record new income in my-money.",
};

export const dynamic = "force-dynamic";

function getBangladeshDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export default async function AddMoneyPage() {
  if (!(await getPageSession())) redirect("/login");
  const currentDate = getBangladeshDate();

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Link className={styles.backLink} href="/">
          <span aria-hidden="true">←</span> Back to overview
        </Link>

        <section className={styles.intro}>
          <p className={styles.eyebrow}>New transaction</p>
          <h1>Add money</h1>
          <p>Keep your balance up to date by recording a deposit, payment, or income.</p>
        </section>

        <AddMoneyForm currentDate={currentDate} />
      </main>
      <Footer />
    </div>
  );
}