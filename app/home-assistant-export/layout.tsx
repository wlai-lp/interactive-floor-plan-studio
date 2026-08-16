import Link from "next/link";
import type { ReactNode } from "react";
import { HAFloorplanLogo } from "../../components/brand/HAFloorplanLogo";
import "./export-brand.css";

export default function HomeAssistantExportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="export-branded-layout">
      <Link className="export-brand-overlay" href="/" aria-label="HAFloorplan home">
        <HAFloorplanLogo className="app-brand-logo" />
        <span className="beta">LOCAL</span>
      </Link>
      {children}
    </div>
  );
}
