import Link from "next/link";
import Header from "../../src/components/Header/Header";
import Footer from "../../src/components/Footer/Footer";
import SpentMoneyForm from "../../src/components/SpentMoneyForm/SpentMoneyForm";
import { getPageSession } from "../../src/lib/auth";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export const metadata = {
  title: "Spent money | my-money",
  description: "Record a new expense in my-money.",
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

export default async function SpentMoneyPage() {
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
          <p className={styles.eyebrow}>New expense</p>
          <h1>Spent money</h1>
          <p>Record where your money went and keep your spending picture honest.</p>
        </section>

        <SpentMoneyForm currentDate={currentDate} />
      </main>
      <Footer />
    </div>
  );
}