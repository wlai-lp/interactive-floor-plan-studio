import type { ReactNode } from "react";
import { MarketingShell } from "../../components/marketing/MarketingShell";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
