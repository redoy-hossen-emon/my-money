import { redirect } from "next/navigation";
import Header from "../../src/components/Header/Header";
import Footer from "../../src/components/Footer/Footer";
import ProfileSettings from "../../src/components/ProfileSettings/ProfileSettings";
import { getPageSession } from "../../src/lib/auth";
import styles from "../reports/page.module.css";

export const metadata = { title: "Profile settings | My Money" };

export default async function ProfilePage() {
  if (!(await getPageSession())) redirect("/login");

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <ProfileSettings />
      </main>
      <Footer />
    </div>
  );
}