import Link from "next/link";
import styles from "./public-home.module.css";

export default function Page() {
  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>HA FLOORPLAN</p>
        <h1 className={styles.title}>Build native Home Assistant floor plans visually.</h1>
        <p className={styles.copy}>
          The public HAFloorplan.com experience is being built here. The working MVP editor now lives at its permanent application route so the landing page, blog, and About experience can evolve independently.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/editor">Open Editor</Link>
          <Link className={styles.secondary} href="/home-assistant-export">Home Assistant Export</Link>
        </div>
        <p className={styles.note}>Your existing locally saved project uses the same browser storage and remains available in the editor.</p>
      </section>
    </main>
  );
}
