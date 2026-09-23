import AuthForm from "../../src/components/AuthForm/AuthForm";
import styles from "../auth.module.css";

export const metadata = { title: "Register | Pennywise" };

export default function RegisterPage() {
  return (
    <main className={styles.page}>
      <AuthForm mode="register" />
    </main>
  );
}
