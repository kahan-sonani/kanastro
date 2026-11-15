import type { ReactNode } from "react";
import styles from "./info.module.css";

export default function InfoLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Kanastro home">✧ kanastro.</a>
        <a href="/">Open app ↗</a>
      </header>
      <main className={styles.content}>{children}</main>
      <footer className={styles.footer}>
        <nav aria-label="Information">
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <a href="https://github.com/kahan-sonani/kanastro">Source · AGPL-3.0</a>
      </footer>
    </div>
  );
}
