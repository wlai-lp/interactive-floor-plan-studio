import type { CSSProperties } from "react";
import "./hafloorplan-logo.css";

export function HAFloorplanMark({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      className={`hafloorplan-mark ${className}`.trim()}
      style={style}
      viewBox="0 0 48 48"
      role="img"
      aria-label="HAFloorplan"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 21 24 5l18 16v21H6V21Z" />
      <path d="M24 42V27h18" />
    </svg>
  );
}

export function HAFloorplanLogo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`hafloorplan-logo ${className}`.trim()}>
      <HAFloorplanMark />
      {!compact && <span className="hafloorplan-wordmark">HAFloorplan</span>}
    </span>
  );
}
