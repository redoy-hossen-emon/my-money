import styles from "./Footer.module.css";

function Icon({ name }) {
  if (name === "home") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" /><path d="M9 20v-6h6v6" /></svg>;
  }

  if (name === "add") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></svg>;
  }

  if (name === "spent") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7.5h14v11H5z" /><path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M8 12h8M12 9v6" /></svg>;
  }

  if (name === "report") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V5M5 19h14" /><path d="m8 15 3-4 3 2 4-6" /></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5.5 19c.8-3 2.9-4.5 6.5-4.5s5.7 1.5 6.5 4.5" /></svg>;
}

const items = [
  { label: "Home", icon: "home", href: "/", active: true },
  { label: "Add money", icon: "add", href: "/add-money" },
  { label: "Spent money", icon: "spent", href: "/spent-money" },
  { label: "Reports", icon: "report", href: "/reports" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.navigation} aria-label="Quick navigation">
        {items.map((item) => (
          <a className={`${styles.navItem} ${item.active ? styles.active : ""}`} href={item.href} key={item.label}>
            <span className={styles.icon}><Icon name={item.icon} /></span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </footer>
  );
}