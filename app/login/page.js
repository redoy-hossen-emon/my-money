import AuthForm from "../../src/components/AuthForm/AuthForm";
import styles from "../auth.module.css";

export const metadata = { title: "Log in | my-money" };

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <AuthForm mode="login" />
    </main>
  );
}
