"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The editor restores project, onboarding, and deep-link selection state from
 * browser-only APIs during its initial client render. The server cannot read
 * those values, so rendering the editor before hydration can produce a
 * different tree (for example, the Home Assistant welcome callout may exist
 * only on the client).
 *
 * Keep the editor route behind a client-mount boundary so the server and the
 * browser hydrate the same empty boundary, then render the editor with the
 * already-restored browser state. Other routes (including /blog) remain
 * server-rendered normally.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === "/" && !mounted) return null;

  return children;
}
