import { LandingHero } from "../components/marketing/LandingHero";
import { MarketingShell } from "../components/marketing/MarketingShell";

export default function Page() {
  return (
    <MarketingShell>
      <LandingHero />
    </MarketingShell>
  );
}
