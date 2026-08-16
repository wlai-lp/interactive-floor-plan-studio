import Link from "next/link";
import type { ReactNode } from "react";
import { HAFloorplanLogo } from "../../components/brand/HAFloorplanLogo";
import "./editor-brand.css";

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="editor-branded-layout">
      <Link className="editor-brand-overlay" href="/" aria-label="HAFloorplan home">
        <HAFloorplanLogo className="app-brand-logo" />
        <span className="beta">LOCAL</span>
      </Link>
      {children}
    </div>
  );
}
