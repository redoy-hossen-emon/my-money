import Header from "../src/components/Header/Header";
import Footer from "../src/components/Footer/Footer";
import Dashboard from "../src/components/Dashboard/Dashboard";
import styles from "./page.module.css";
import { redirect } from "next/navigation";
import { getPageSession } from "../src/lib/auth";

export default async function Home() {
  if (!(await getPageSession())) redirect("/login");

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main} id="overview">
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}
